# Seguridad y privacidad — Temple

**Alcance:** diseño de la fase en la nube (cuentas reales, red social) y honestidad sobre el modo local actual
**Estado:** el modo local está implementado; la fase en la nube es un diseño listo para construir
**Última revisión:** 14 de junio de 2026

Temple es, hoy, una app *local-first*: todo vive en el `IndexedDB` del dispositivo y no hay servidor. La capa de comunidad añade cuentas, sesión, privacidad por publicación y un grafo de seguidores, pero **en modo local esa seguridad es una simulación para la demo, no protección real**. Este documento explica con franqueza qué protege el modo local y qué no, y diseña la seguridad de verdad para cuando la app pase a la nube.

> **Por qué este documento existe.** En un portfolio, afirmar "tiene login y privacidad" sin matizar es deshonesto: cualquier desarrollador con las DevTools abiertas puede leer y editar el `IndexedDB`. Preferimos demostrar criterio: separar la *interfaz* de seguridad (estable) de la *implementación* (local hoy, servidor mañana) y documentar el modelo de amenazas real.

---

## 1. La verdad sobre el modo local (lo que NO es seguridad)

| Mecanismo | Qué hace en local | Por qué **no** es seguridad real |
|---|---|---|
| Hash de contraseña PBKDF2-SHA256 (`src/data/crypto.ts`) | Deriva la contraseña con sal de 16 bytes y 100 000 iteraciones antes de guardarla | El hash y la verificación ocurren **en el cliente**. Quien abra las DevTools ve la base de datos entera; puede sobrescribir el hash o saltarse la verificación. Un hash en cliente solo evita guardar la contraseña en claro, nada más |
| Sesión (`localStorage`) | Recuerda qué cuenta está activa | `localStorage` es legible y editable por cualquier script de la página y por el usuario. No es un token firmado |
| Visibilidad por publicación (pública / seguidores / privada) | El feed se filtra con `visiblePosts()` antes de pintar | El filtro es **estética en el cliente**: los datos completos están en el `IndexedDB`. No hay nadie a quien "ocultárselos" porque la base de datos es del propio usuario |
| Cuentas de ejemplo sin contraseña | Marta y Álex son seguibles pero tienen `passwordHash` vacío | Solo evita que alguien "inicie sesión" como ellas en la demo; no es control de acceso |

**Regla de oro del modo local:** los datos de un dispositivo pertenecen a quien controla ese dispositivo. No intentamos defendernos del dueño del navegador, porque es imposible y no tiene sentido. La privacidad entre usuarios **solo existe cuando hay un servidor que la imponga**.

El código está escrito para hacer este salto sin reescribir la interfaz: `AuthService` y `SocialRepository` son contratos; `LocalAuthService` / `LocalSocialRepository` son la implementación de hoy. Mañana entra `SupabaseAuthService` / `SupabaseSocialRepository` sin tocar la UI.

---

## 2. Arquitectura de la fase en la nube

Pila elegida por ser **100 % gratuita en su nivel de entrada, de código abierto y sin lock-in**: [Supabase](https://supabase.com) (Postgres gestionado + Auth + Storage + Realtime).

```
  Navegador (PWA)
     │  HTTPS (TLS 1.2+), solo la anon key pública
     ▼
  Supabase Auth  ──►  JWT firmado (RS256)  ──►  cada petición lleva el JWT
     │                                              │
     ▼                                              ▼
  Postgres  ◄───────  Row Level Security (RLS)  ◄───  auth.uid() del JWT
```

- **El servidor es la única fuente de verdad de la autorización.** El cliente nunca decide qué puede ver; lo decide Postgres con políticas RLS evaluadas en cada fila.
- **Dos claves, roles opuestos:**
  - `anon` key — pública, va en el bundle del cliente, **segura de exponer**. Solo permite lo que las políticas RLS dejen al rol anónimo/autenticado.
  - `service_role` key — **NUNCA** en el cliente, NUNCA en el repositorio, NUNCA en una variable `VITE_*`. Salta toda la RLS. Vive solo en funciones de servidor (Edge Functions) y en secretos de despliegue.

> Comprobación de seguridad nº 1 del proyecto: `git grep -i service_role` debe devolver **cero** coincidencias en el código del cliente.

---

## 3. Autenticación (Supabase Auth)

- **Métodos:** email + contraseña y OAuth con Google (ambos gratis). El hash de contraseña lo hace el servidor con **bcrypt**; el cliente envía la contraseña por TLS y jamás la almacena.
- **Tokens:** JWT de acceso de vida corta (~1 h) + *refresh token* rotatorio. La librería `@supabase/supabase-js` los guarda y renueva; en una PWA conviene `httpOnly` cookies vía SSR cuando sea posible para mitigar XSS.
- **Política de contraseñas:** mínimo 8 caracteres (ya validado en `validatePassword`), se recomienda contrastar contra listas de contraseñas filtradas (Supabase lo ofrece con HaveIBeenPwned).
- **Verificación de email** obligatoria antes de publicar, para frenar cuentas desechables y spam.
- **Anti-enumeración de usuarios:** el login devuelve un mensaje genérico ("Usuario o contraseña incorrectos") tanto si el usuario no existe como si la contraseña falla. El `LocalAuthService` ya lo hace **y** ejecuta un hash de coste equivalente en la rama "usuario no existe" para no filtrar la diferencia por tiempo de respuesta.
- **Límite de intentos (rate limiting):** Supabase Auth limita los intentos de login y de envío de emails por IP; en producción se complementa con un *captcha* invisible (hCaptcha/Turnstile) solo tras varios fallos, nunca de entrada (ver §6, WCAG 3.3.8).

### Accesibilidad de la autenticación (WCAG 2.2 — 3.3.8)

El criterio "Accessible Authentication" exige no imponer pruebas cognitivas. El formulario de Temple ya cumple:

- `autocomplete="username"`, `autocomplete="current-password"` / `"new-password"` para que los gestores rellenen.
- **Se permite pegar** la contraseña (nada de `onpaste` bloqueado).
- Sin CAPTCHA de puzzles ni cálculos como requisito de acceso.
- Botón "mostrar contraseña" recomendado para reducir errores de tecleo.

---

## 4. Modelo de datos y Row Level Security

Esquema mínimo de la red social (Postgres). Toda tabla con datos de usuario lleva `owner uuid references auth.users` y RLS **activada** (`alter table … enable row level security`). Sin una política que lo permita explícitamente, **el acceso por defecto es denegar**.

```sql
-- Perfiles públicos (no contienen secretos)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  private_profile boolean not null default false,
  created_at timestamptz not null default now()
);

-- Publicaciones, con visibilidad por fila
create type visibility as enum ('publica', 'seguidores', 'privada');
create table posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users on delete cascade,
  text text,
  visibility visibility not null default 'publica',
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Grafo de seguidores
create table follows (
  follower uuid not null references auth.users on delete cascade,
  followee uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee)
);

alter table profiles enable row level security;
alter table posts    enable row level security;
alter table follows  enable row level security;
```

### Políticas RLS — la privacidad se impone aquí, no en el cliente

```sql
-- Función auxiliar: ¿el usuario actual sigue a X?
create or replace function is_following(target uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from follows
    where follower = auth.uid() and followee = target
  );
$$;

-- LECTURA de publicaciones: la misma lógica que visiblePosts(), pero imposible de saltar
create policy "leer publicaciones visibles" on posts for select using (
  author = auth.uid()                                   -- las propias, siempre
  or visibility = 'publica'                             -- públicas, para todos
  or (visibility = 'seguidores' and is_following(author)) -- de seguidores, si sigo al autor
  -- 'privada' nunca llega aquí salvo por la primera condición (author = auth.uid())
);

-- ESCRITURA: solo puedes crear/editar/borrar lo tuyo
create policy "crear lo propio"  on posts for insert with check (author = auth.uid());
create policy "borrar lo propio" on posts for delete using       (author = auth.uid());
create policy "editar lo propio" on posts for update using        (author = auth.uid());

-- follows: solo gestionas tus propios seguimientos
create policy "seguir como yo"   on follows for insert with check (follower = auth.uid());
create policy "dejar de seguir"  on follows for delete using       (follower = auth.uid());
create policy "ver seguimientos" on follows for select using (true); -- el grafo es público
```

El paralelismo es deliberado: la política `"leer publicaciones visibles"` reproduce línea por línea la función `visiblePosts()` del cliente. La del cliente es para *no pedir lo que no se va a poder ver* (rendimiento y UX); la de RLS es la que **de verdad** protege, evaluada por Postgres en cada fila aunque alguien forje peticiones a mano.

---

## 5. Privacidad y cumplimiento del RGPD

La app es para usuarios de la UE; el RGPD aplica. Decisiones de diseño:

- **Minimización de datos (art. 5.1.c):** solo se piden usuario, nombre visible y, opcional, biografía. Nada de fecha de nacimiento, teléfono ni ubicación. El peso, las medidas y la nutrición son **datos de salud (categoría especial, art. 9)**: por defecto se quedan **solo en el dispositivo** y nunca se suben a la comunidad.
- **Derecho de acceso y portabilidad (arts. 15 y 20):** Ajustes → "Exportar todo (JSON)" entrega los datos en formato abierto y legible por máquina. Ya implementado.
- **Derecho de supresión / al olvido (art. 17):** Ajustes → "Borrar mi cuenta" elimina perfil, publicaciones y seguimientos en una transacción (`deleteAccount`). En la nube, `on delete cascade` garantiza que no quedan filas huérfanas. Ya implementado en local.
- **Derecho de rectificación (art. 16):** edición de perfil y cambio de contraseña en Ajustes. Implementado.
- **Consentimiento y base legal:** el registro muestra el aviso de modo local; en producción se añade enlace a Política de Privacidad y Términos antes de crear la cuenta. Sin cookies de seguimiento ni analítica de terceros: no hay banner de consentimiento que mendigar.
- **Privacidad desde el diseño y por defecto (art. 25):** las cuentas pueden marcarse como *perfil privado*; las publicaciones nacen con la visibilidad que elija el autor (por defecto pública, pero cambiable en el mismo diálogo, sin fricción).
- **Cifrado:** TLS en tránsito (obligado por Supabase); cifrado en reposo del Postgres gestionado. Las contraseñas nunca se guardan en claro.
- **Retención:** al borrar la cuenta, borrado inmediato; copias de seguridad rotan en ≤ 30 días.

---

## 6. Modelo de amenazas (OWASP)

Cobertura de los riesgos más relevantes del [OWASP Top 10](https://owasp.org/Top10/) para esta arquitectura:

| Amenaza | Vector en Temple | Mitigación |
|---|---|---|
| **A01 Broken Access Control** | Un usuario intenta leer publicaciones "privada"/"seguidores" ajenas forjando peticiones | RLS en Postgres evaluada por fila con `auth.uid()`; el cliente nunca es la autoridad. Política *deny by default* |
| **A02 Cryptographic Failures** | Contraseñas o tokens expuestos | bcrypt en servidor; TLS 1.2+; `service_role` jamás en el cliente; JWT firmado RS256 |
| **A03 Injection (SQL/XSS)** | Texto de publicaciones o comentarios | Consultas parametrizadas vía el SDK (nunca SQL concatenado); React escapa el HTML por defecto; `Content-Security-Policy` estricta; sin `dangerouslySetInnerHTML` |
| **A04 Insecure Design** | Confiar la privacidad al cliente | Separación interfaz/implementación; la autorización vive en el servidor por diseño, no como parche |
| **A05 Security Misconfiguration** | Tabla sin RLS, clave filtrada | *Checklist* de despliegue: toda tabla con `enable row level security`; secretos solo en variables de entorno del servidor; revisión `git grep service_role` |
| **A07 Identification & Auth Failures** | Fuerza bruta, enumeración de usuarios, secuestro de sesión | Rate limiting de Supabase Auth; mensaje de error genérico + hash de coste constante; refresh tokens rotatorios; verificación de email |
| **A08 Data Integrity Failures** | Dependencias comprometidas | `npm audit` en CI; *lockfile* fijado; dependencias mínimas |
| **A10 SSRF / abuso de IA** | La clave de Gemini del escáner de macros | La clave la pone el usuario y vive **solo en su dispositivo** (`localStorage`), nunca en el servidor de la app ni en el código |

Amenazas específicas de una red social:

- **Spam y cuentas desechables:** verificación de email + rate limiting de publicación.
- **Acoso:** en el roadmap, bloqueo y reporte de usuarios (otra política RLS: ocultar contenido de cuentas bloqueadas).
- **Scraping del grafo:** el grafo de seguidores es público por decisión de producto (como en redes mayoritarias); los datos sensibles (salud) nunca se exponen.

---

## 7. Checklist de paso a producción

Antes de activar la fase nube:

- [ ] Toda tabla de usuario tiene `enable row level security` y al menos una política `select`/`insert`/`update`/`delete` revisada.
- [ ] `git grep -i service_role` → 0 resultados en `src/`.
- [ ] Variables `VITE_*` contienen **solo** la `anon` key y la URL del proyecto.
- [ ] `npm audit` sin vulnerabilidades altas/críticas; `npm test` y el test de regresión de axe en verde.
- [ ] Verificación de email activada; política de contraseñas con comprobación de filtraciones.
- [ ] Política de Privacidad y Términos enlazadas en el registro.
- [ ] Pruebas de RLS: con el JWT de un usuario A, intentar `select` de una publicación "privada" de B devuelve 0 filas.
- [ ] Cabeceras de seguridad: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

---

## 8. Resumen honesto para el lector del portfolio

- **Hoy:** Temple funciona sin servidor; las cuentas y la privacidad son una **simulación local** coherente, escrita tras interfaces (`AuthService`, `SocialRepository`) listas para la nube. Se documenta abiertamente que **no es seguridad real**.
- **Mañana:** entra Supabase. La autorización pasa a Postgres con **RLS**, la autenticación a **Supabase Auth (JWT + bcrypt)**, y la UI **no cambia** porque solo cambia la implementación de los contratos.
- **Lo que ya está bien hecho:** anti-enumeración con tiempo constante, RGPD (export, borrado, rectificación), accesibilidad de la autenticación (WCAG 3.3.8), datos de salud que no salen del dispositivo, y un modelo de amenazas explícito.

El valor de demostración no está en fingir seguridad, sino en **saber exactamente dónde está la frontera entre cliente y servidor, y diseñar la app para cruzarla sin reescribirla**.
