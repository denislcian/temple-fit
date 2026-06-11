# 🔥 ForjaFit — Tu cuaderno de gimnasio

> **PWA de registro de entrenamientos de fuerza: gratis, sin cuentas, 100% offline y accesible (WCAG 2.2 AA).** Regala exactamente lo que las apps comerciales cobran — rutinas ilimitadas, historial completo, analítica y export de datos — y funciona donde se usa: un gimnasio sin cobertura.

![CI](https://github.com/TU_USUARIO/forjafit/actions/workflows/ci.yml/badge.svg)
*(sustituye `TU_USUARIO` al subirlo a GitHub; el badge se activa solo)*

**Stack:** React 19 · TypeScript estricto · Vite 8 · Dexie/IndexedDB · Recharts · vite-plugin-pwa (Workbox) · Vitest + Testing Library + axe-core · GitHub Actions
**Coste total del proyecto: 0 €** — todas las herramientas y servicios son gratuitos.

---

## Índice

1. [El problema (por qué existe esto)](#1-el-problema)
2. [Qué hace](#2-qué-hace)
3. [Cómo ejecutarlo](#3-cómo-ejecutarlo)
4. [Arquitectura por capas](#4-arquitectura-por-capas)
5. [El paso a paso: cómo se construyó, capa a capa](#5-el-paso-a-paso)
6. [Decisiones técnicas y por qué](#6-decisiones-técnicas)
7. [Accesibilidad](#7-accesibilidad)
8. [Testing y calidad](#8-testing-y-calidad)
9. [Cómo desplegarlo gratis](#9-despliegue-gratuito)
10. [Tus datos son tuyos](#10-tus-datos-son-tuyos)
11. [Roadmap](#11-roadmap)
12. [Cómo presentar este proyecto (CV / LinkedIn / entrevista)](#12-cómo-presentarlo)
13. [Documentación](#13-documentación)

---

## 1. El problema

Construí ForjaFit porque las apps de registro de gimnasio cobran por lo básico y fallan exactamente donde se usan:

| Queja real de los usuarios | Lo que hace el mercado | Lo que hace ForjaFit |
|---|---|---|
| "Solo puedo crear 3 rutinas gratis" | Strong limita a 3 rutinas; Hevy a ~4 | **Rutinas ilimitadas** |
| "Mi historial de hace 4 meses está bloqueado" | Hevy gratis recorta a ~3 meses | **Historial completo, siempre** |
| "No puedo exportar mis propios datos" | Export tras paywall en Strong/MyFitnessPal | **Export JSON y CSV en un clic** |
| "La app no va sin cobertura en el gimnasio" | Hevy requiere conexión para varias funciones | **100% offline (PWA + IndexedDB)** |
| "¿Por qué una app de pesas me rastrea?" | Analytics, ads e integraciones sociales | **Cero rastreo. Los datos no salen del dispositivo** |
| *(nadie lo pide porque nadie lo da)* | Ningún competidor publicita accesibilidad | **WCAG 2.2 AA auditado y documentado** |

Estos huecos no son una corazonada: salen de una investigación de mercado con verificación de fuentes que está documentada en el [informe técnico](docs/INFORME_TECNICO.md).

## 2. Qué hace

- **Entrenar**: registra series (repeticiones × peso) viendo *lo que hiciste la última vez* en cada ejercicio; el botón "añadir serie" copia la anterior. El borrador sobrevive si cierras la app a mitad de entrenamiento. Temporizador de descanso que anuncia los hitos también por lector de pantalla.
- **Récords automáticos**: detecta tus PRs (mejor peso y mejor 1RM estimado con las fórmulas de Epley y Brzycki) y los celebra al guardar.
- **Rutinas ilimitadas** + **generador de planes**: dile tu objetivo (fuerza / hipertrofia / definición), tus días por semana, tu material y tu nivel, y te monta el plan semanal con esquema de series×reps y pauta de progresión. Algoritmo propio, determinista y testeado — sin humo de "IA".
- **Progreso**: volumen semanal y evolución de 1RM por ejercicio en gráficas accesibles (resumen textual + tabla alternativa, no solo el dibujo).
- **Biblioteca de 52 ejercicios redactada en español** desde cero (ver la historia legal en la sección 6) + ejercicios personalizados sin límite.
- **PWA instalable**: "Añadir a pantalla de inicio" y funciona en modo avión.
- **Tema oscuro (gimnasio) y claro (papel)**, ambos con contraste AA.

Y desde la fase 2 (capas 6-8):

- **Perfil y objetivos**: tus datos corporales calculan tus objetivos de calorías y macros (fórmula de Mifflin-St Jeor) — todo en tu dispositivo.
- **Nutrición**: diario de calorías/macros por comidas con barras de progreso; catálogo de ~70 alimentos en español; **búsqueda real en Open Food Facts** por nombre y código de barras (gratis, sin API key); **generador de dietas** que compone un día completo con alimentos reales resolviendo los gramos con un sistema lineal 3×3 por comida.
- **Escáner de macros por foto (IA)**: haz una foto del plato y Gemini estima alimentos, gramos y macros. Usa **tu propia clave gratuita** de [Google AI Studio](https://aistudio.google.com/apikey) (se guarda solo en tu dispositivo, nunca en el código); sin clave o sin red, la app degrada al registro manual.
- **Comunidad**: publica tu rutina o tu última sesión, recibe me gusta y comentarios. En **modo local de demostración** (todo en tu dispositivo, con publicaciones de ejemplo): la interfaz `SocialRepository` está lista para enchufar Supabase en la fase de nube sin tocar la UI.

Y desde la fase 3 (capas 9-11), las herramientas que el mercado cobra en premium:

- **Calculadora de discos**: dime tu peso objetivo y te digo qué poner en cada lado de la barra (con aviso si el peso no es montable con discos estándar) + **series de calentamiento** sugeridas (barra, 40/60/80%).
- **Progresión sugerida**: al ver "lo que hiciste la última vez", la app te dice si toca subir peso, buscar una repetición más o consolidar (doble progresión clásica) — sin humo de IA, reglas claras y testeadas.
- **Cronómetro de sesión** y duración guardada en el historial.
- **Tu cuerpo**: registro de peso y medidas (cintura, pecho, brazo, muslo, % graso) con gráfica de evolución; el peso nuevo **recalcula automáticamente tus objetivos de macros**.
- **Constancia**: racha de semanas entrenando y heatmap de los últimos 3 meses.
- **12 logros** derivados de tus datos reales (tonelaje acumulado, rachas, récords, días de diario…): o lo has hecho o no — no hay insignias regaladas.
- **Hidratación**: contador de vasos de agua por día.
- **Copiar el día anterior** en el diario de nutrición (la fricción nº 1 del registro diario).

📸 *Capturas: ver [docs/capturas](docs/capturas/README.md).*

## 3. Cómo ejecutarlo

Necesitas [Node.js](https://nodejs.org/) 20.19+ o 22+ (gratis).

```bash
git clone https://github.com/TU_USUARIO/forjafit.git
cd forjafit
npm install        # instala las dependencias
npm run dev        # abre http://localhost:5173
```

Otros comandos:

```bash
npm test               # tests (Vitest)
npm run test:coverage  # tests con informe de cobertura
npm run lint           # ESLint (incluye reglas de accesibilidad jsx-a11y)
npm run typecheck      # comprobación de tipos TypeScript
npm run build          # build de producción en /dist (incluye service worker)
npm run preview        # sirve el build de producción
```

## 4. Arquitectura por capas

El código está organizado en capas con una regla de oro: **las dependencias siempre apuntan hacia abajo**. La interfaz conoce al dominio y a los datos; el dominio no conoce a nadie.

```
┌──────────────────────────────────────────────────────┐
│  CAPA 4 · PWA / Plataforma     vite.config.ts        │
│  service worker (Workbox), manifest, offline         │
├──────────────────────────────────────────────────────┤
│  CAPA 3 · Interfaz             src/ui/               │
│  vistas, componentes accesibles, mini-router hash,   │
│  gestión de foco SPA, temas                          │
├──────────────────────────────────────────────────────┤
│  CAPA 2 · Dominio              src/domain/           │
│  funciones puras: 1RM, volumen, récords, estadís-    │
│  ticas, generador de planes → 100% testeadas         │
├──────────────────────────────────────────────────────┤
│  CAPA 1 · Datos                src/data/             │
│  modelos, repositorios (Dexie/IndexedDB), catálogo,  │
│  export/import validado                              │
└──────────────────────────────────────────────────────┘
```

**Por qué importa** (y es la respuesta cuando te pregunten en una entrevista): si mañana añado un backend (ver roadmap), solo escribo otra implementación del repositorio — la UI y el dominio no se tocan. Y como el dominio son funciones puras sin React ni base de datos, testearlo al 100% es trivial.

## 5. El paso a paso

Cada capa se cerró con su código, sus tests en verde y su commit descriptivo ([Conventional Commits](https://www.conventionalcommits.org/es/)). El historial de git ES la documentación del proceso: `git log --oneline`.

### Capa 0 — Cimientos (`chore: scaffold Vite 8 + React 19 + TypeScript estricto`)

1. `npm create vite` con template react-ts y **TypeScript estricto** (`noUncheckedIndexedAccess` incluido).
2. ESLint 9 con `eslint-plugin-jsx-a11y` (errores de accesibilidad detectados en el editor, antes del commit), Prettier, Vitest 4 + Testing Library + `fake-indexeddb`.
3. CI de GitHub Actions: `lint → typecheck → test → build` en cada push (gratis e ilimitado en repos públicos) + workflow de deploy a GitHub Pages.
4. `index.html` semántico con `lang="es"`.

### Capa 1 — Datos (`feat(datos): capa de datos completa con IndexedDB`)

1. **Modelos** tipados (`src/data/models.ts`): ejercicio, rutina, sesión, serie. Esquema de export versionado.
2. **Base de datos** (`db.ts`): Dexie sobre IndexedDB (~5 MiB de localStorage frente a GB de IndexedDB) + petición de almacenamiento persistente.
3. **Repositorios** (`repositories/`): CRUD + `getLastSetsForExercise` (la consulta que alimenta "lo que hiciste la última vez").
4. **Catálogo propio** de 52 ejercicios escrito en español desde cero (`catalog.ts`) — decisión legal explicada en la sección 6.
5. **Export/import** (`exportImport.ts`): JSON versionado con validación por type guards (un archivo corrupto da un error claro, no rompe la app) y CSV con escapado correcto.
6. 17 tests con IndexedDB simulada en memoria.

### Capa 2 — Dominio (`feat(dominio): logica de calculo pura con cobertura 100%`)

1. `oneRepMax.ts`: fórmulas de Epley y Brzycki + estimación combinada, con validación de entradas.
2. `volume.ts`: volumen por serie/sesión/ejercicio/semana (semanas agrupadas por lunes UTC).
3. `records.ts`: récords personales automáticos y detección de "esta serie es un PR".
4. `stats.ts`: series temporales para las gráficas **y los resúmenes textuales accesibles**.
5. `routineGenerator.ts` (v1.1): generador de planes por patrones de movimiento.
6. **Cobertura 100%** de esta capa: es lógica pura, no hay excusa.

### Capa 3 — Interfaz (`feat(ui): interfaz completa accesible WCAG 2.2 AA`)

1. **Design system propio** "hierro y brasa": tokens CSS (colores verificados AA en tema oscuro y claro), tipografía Archivo autoalojada (cero peticiones externas), acento complementario teal.
2. **Mini-router por hash** de ~40 líneas (sin dependencia): evita los 404 de los hosting estáticos, funciona con el botón atrás, y al cambiar de vista **mueve el foco al `<h1>` y lo anuncia** — sin esto, navegar una SPA es silencioso para un lector de pantalla.
3. Seis vistas: Entrenar, Historial, Rutinas (+generador), Ejercicios, Progreso, Ajustes.
4. Detalles que marcan la diferencia: inputs numéricos con el patrón GOV.UK (`inputmode`, nunca `type="number"`), diálogos con `<dialog>` nativo (focus trap gratis), targets de 44 px, gráficas con resumen + tabla, `prefers-reduced-motion`.
5. La vista Progreso se carga en diferido (`React.lazy`): Recharts (~107 KB gzip) solo se descarga si entras.

### Capas 6-8 — Fase 2: perfil, nutrición y comunidad

1. **Capa 6 — Perfil** (`feat(perfil)`): datos corporales y objetivo → BMR con Mifflin-St Jeor, TDEE por actividad y reparto de macros (proteína por g/kg según objetivo, grasa al 25%, resto carbohidratos), todo testeado con valores de referencia.
2. **Capa 7 — Nutrición** (`feat(nutricion)`): diario por comidas con objetivos del perfil; catálogo de alimentos propio; cliente de Open Food Facts con manejo honesto de errores (distingue "sin conexión" del límite de 10 búsquedas/min del servicio, que descubrimos verificando en navegador); generador de dietas con álgebra lineal (regla de Cramer) verificado a −1,2% de las kcal objetivo; escáner por foto con Gemini y degradación elegante; export/import v2 retrocompatible con copias v1.
3. **Capa 8 — Comunidad** (`feat(comunidad)`): feed con likes accesibles (`aria-pressed` + anuncios), comentarios y publicación de rutinas/sesiones estructuradas. El repositorio social es una interfaz: la implementación local de hoy se sustituirá por el adaptador Supabase de la fase de nube sin tocar ninguna vista.
4. **Navegación adaptativa** (`feat(nav)`): en móvil, 5 pestañas inferiores en la zona del pulgar con indicador de pestaña activa + vista "Más"; en escritorio, barra lateral fija con secciones agrupadas (Entrenamiento / Seguimiento / Comunidad), marca arriba y Ajustes + cambio de tema al pie. Título de la pestaña del navegador dinámico por vista.

### Capas 9-11 — Fase 3: herramientas premium, cuerpo y constancia

1. **Capa 9 — Herramientas de fuerza** (`feat(fuerza)`): `gymTools.ts` con la calculadora de discos (algoritmo voraz con residual cuando el peso no es montable), series de calentamiento (redondeadas a múltiplos de 2,5 kg) y sugerencia de progresión (subir / repetir / consolidar). Cronómetro de sesión y duración persistida.
2. **Capa 10 — Cuerpo y constancia** (`feat(cuerpo)`): medidas corporales que sincronizan el perfil (y con él los objetivos de macros), racha semanal robusta (no se rompe un lunes por la mañana), heatmap de 12 semanas y 12 logros **derivados** de los datos — al ser funciones puras sobre el estado real, no hay nada que pueda desincronizarse. DB v3 y export v3 retrocompatible.
3. **Capa 11 — Nutrición plus** (`feat(nutricion)`): hidratación diaria persistida y "copiar el día anterior".
4. Bug real cazado por axe en esta fase (en el log de git): una `opacity` sobre los logros pendientes degradaba el contraste del texto a 3,98:1 — se corrigió atenuando solo lo decorativo. Las herramientas automáticas valen cuando se ejecutan sobre la UI real.

### Capa 4 — PWA y auditoría (`feat(pwa): app instalable y 100% offline + auditoria a11y`)

1. `vite-plugin-pwa` (Workbox): manifest en español + precache completa → offline real tras la primera visita. Iconos generados por script propio ([scripts/generate-icons.py](scripts/generate-icons.py)).
2. **Auditoría de accesibilidad** con axe-core 4.12 en navegador real: **0 violaciones** en las 6 vistas, ambos temas y estados con diálogo. Informe completo en [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).
3. Verificación funcional en navegador del flujo completo: entrenar → series → récord → historial → gráficas → offline.
4. Dos bugs reales encontrados y corregidos al verificar (están en el log de git): el `backdrop-filter` del header rompía la navegación fija móvil (creaba un *containing block*), y el guard de primer render se rompía con el doble efecto de StrictMode.

## 6. Decisiones técnicas

Resumen de las decisiones con su alternativa descartada (justificación completa con fuentes en el [informe técnico](docs/INFORME_TECNICO.md)):

| Decisión | Por qué | Descartado |
|---|---|---|
| **TypeScript estricto** | 72-82% de las ofertas frontend lo piden; detecta errores antes de ejecutar | JS puro (solo 6% de devs lo usan ya en exclusiva) |
| **IndexedDB local, sin backend** | La demo nunca está caída; privacidad por diseño; coste 0 | Supabase free (se pausa tras 7 días de inactividad), Firebase (NoSQL propietario) |
| **Catálogo de ejercicios propio** | El dataset "gratuito" más famoso tiene imágenes scrapeadas de bodybuilding.com (lo admite su mantenedor) y a un redistribuidor similar le llegó un **DMCA en abril de 2026**. Escribimos los 52 ejercicios en español desde cero: riesgo legal cero y mejor UX en español | Free Exercise DB, ExerciseDB, API Ninjas, MuscleWiki |
| **Recharts (SVG)** | SVG semántico + `accessibilityLayer` navegable por teclado | Chart.js (canvas: invisible para lectores de pantalla, aunque pese menos) |
| **Router hash propio (~40 líneas)** | Sin 404 en hosting estático, foco gestionado a medida, cero dependencias | react-router (innecesario para 6 vistas planas) |
| **`<dialog>` nativo** | Focus trap, Escape y retorno de foco gratis, del navegador | Librerías de modales |
| **GitHub Pages** | Todo en un ecosistema, pipeline visible para reclutadores | Vercel Hobby (prohíbe uso comercial), Netlify free (300 créditos/mes y pausa TODOS tus sitios al agotarlos) |

## 7. Accesibilidad

La accesibilidad es el ángulo diferenciador del proyecto: **ningún competidor del nicho la trabaja** y el European Accessibility Act la exige desde junio de 2025 a los servicios digitales de la UE.

- Auditoría axe-core en navegador real: **0 violaciones** (6 vistas × 2 temas + estados de diálogo).
- Targets táctiles reales de **44×44 px** (WCAG 2.2 pide 24).
- Los criterios nuevos de WCAG 2.2 aplicados al dominio — el ejemplo bonito: *3.3.7 Redundant Entry* exige no pedir datos dos veces… que es exactamente la feature "te enseño lo que hiciste la última sesión". Accesibilidad y producto alineados.
- Test de regresión con axe en CI + checklist manual documentada.

➡️ Informe completo: [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)

## 8. Testing y calidad

```
 48 tests · 10 archivos                    Cobertura (capas 1-2)
 ──────────────────────────                ──────────────────────
 dominio (cálculos, generador)  unit       domain/   100% líneas
 datos (repos, export/import)   unit       data/      ~97% líneas
 UI (render, navegación, axe)   component
```

- La pirámide: muchos tests unitarios rápidos sobre la lógica, tests de componente para los flujos de UI, y axe-core como regresión de accesibilidad.
- CI en GitHub Actions en cada push: lint → typecheck → test → build. Si algo se rompe, el badge se pone rojo antes de que lo vea un reclutador.
- E2E con Playwright: decisión consciente de alcance — está en el roadmap, no olvidado.

## 9. Despliegue gratuito

### Opción A — GitHub Pages (recomendada: todo en un ecosistema)

1. Crea un repo **público** en GitHub llamado `forjafit` y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/forjafit.git
   git push -u origin main
   ```
2. En el repo: **Settings → Pages → Source: "GitHub Actions"**.
3. Listo. El workflow [deploy.yml](.github/workflows/deploy.yml) ya incluido publica la app en `https://TU_USUARIO.github.io/forjafit/` en cada push a `main` (el `base: './'` de Vite ya está configurado para que funcione en esa subruta).

### Opción B — Cloudflare Pages (ancho de banda ilimitado)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → conecta el repo.
2. Build command: `npm run build` · Output: `dist`. Sin tarjeta de crédito.

## 10. Tus datos son tuyos

- Todo vive en **IndexedDB de tu navegador**. No hay servidores, cuentas ni analítica.
- **Ajustes → Exportar todo (JSON)**: copia de seguridad completa con esquema versionado. La importación **fusiona** (nunca borra lo que ya tienes) y valida el archivo (uno corrupto da un error claro).
- **Exportar historial (CSV)**: una fila por serie, listo para Excel/Sheets.
- La app pide al navegador almacenamiento persistente (`navigator.storage.persist()`) para minimizar el riesgo de limpieza automática. Aún así: exporta de vez en cuando.

## 11. Roadmap

La visión completa (con herramientas gratuitas verificadas y riesgos) está en el [informe técnico, sección 14](docs/INFORME_TECNICO.md). En corto:

- ✅ **v1.1** — Generador de planes según objetivo.
- ✅ **v1.2** — Perfil + objetivos de macros (Mifflin-St Jeor).
- ✅ **v1.3** — Nutrición completa: diario, Open Food Facts, generador de dietas y escáner por foto (Gemini con clave propia).
- ✅ **v1.4** — Comunidad en modo local: feed, likes y comentarios con publicaciones de ejemplo.
- **v2.0** — La nube (requiere crear cuenta gratuita de Supabase): login accesible (magic link / Google), y que la Comunidad sea compartida de verdad — la interfaz `SocialRepository` ya existe, solo falta el adaptador. Recordatorio: keep-alive semanal en GitHub Actions (Supabase Free se pausa a los 7 días) y Row Level Security desde el día 1.
- **v2.1** — Mover la llamada a Gemini detrás de un proxy en Supabase Edge Functions (en producción multiusuario la clave no debe viajar desde el cliente; en la app personal actual es la clave del propio usuario y vive solo en su dispositivo).
- **v2.2** — Imágenes de ejecución de ejercicios con licencia limpia (wger CC-BY-SA o ilustración propia).

## 12. Cómo presentarlo

**En el CV** (bullets "logré X usando Y con resultado Z"):

> **ForjaFit** — PWA de registro de entrenamientos, local-first y accesible · React, TypeScript, IndexedDB
> - Desarrollé una PWA offline-first con React 19 + TypeScript estricto y arquitectura por capas, con la capa de dominio testeada al 100% (48 tests, Vitest).
> - Implementé accesibilidad WCAG 2.2 AA: 0 violaciones axe en auditoría completa, gestión de foco SPA, formularios con patrón GOV.UK y gráficas con alternativa textual.
> - Diseñé la estrategia de datos tras verificar licencias de datasets públicos (descartando fuentes con riesgo DMCA) y monté CI/CD gratuito con GitHub Actions.

**En LinkedIn**: sección Proyectos, título "PWA de seguimiento de entrenamientos — offline-first, WCAG 2.2 AA", **el enlace a la demo primero**, el repo después.

**En la entrevista (90 segundos)**: problema (las apps cobran por lo básico y no van sin cobertura) → investigación (verifiqué licencias y descarté datasets con DMCA) → arquitectura (capas + patrón repositorio: puedo enchufar un backend sin tocar la UI) → calidad (tests, CI, auditoría a11y con cifras) → demo en modo avión. 🎤⬇️

## 13. Documentación

| Documento | Qué contiene |
|---|---|
| [docs/INFORME_TECNICO.md](docs/INFORME_TECNICO.md) | Investigación de mercado con fuentes verificadas, matriz de decisiones, arquitectura, riesgos, roadmap |
| [docs/INFORME_TECNICO.pdf](docs/INFORME_TECNICO.pdf) | El mismo informe en PDF, listo para adjuntar o imprimir |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) | Declaración de accesibilidad y auditoría WCAG 2.2 completa |
| `git log` | El paso a paso real del desarrollo, capa a capa |

## Licencia

[MIT](LICENSE) — úsalo, apréndelo, mejóralo.
