# Crear y monetizar una app en 2026 — Informe exhaustivo aplicado a *Temple/forjafit*

> Investigación de mercado con fuentes verificadas (2025–2026). Aplicada al caso concreto: **Temple**, una PWA de fitness/nutrición *local-first*, accesible (WCAG 2.2 AA), gratis, sin cuentas ni rastreo, construida por un dev en solitario en España.
>
> **Aviso:** la sección fiscal/legal es **información general, no asesoramiento personalizado**. Consulta un **gestor/asesor fiscal colegiado** antes de actuar.

---

## 0. Veredicto en una página (léelo primero)

- **Es totalmente posible crear y monetizar una app hoy.** Lo difícil no es cobrar: es que te paguen lo suficiente. El mercado es enorme (≈**167.000 M$ de gasto in-app en 2025**, Sensor Tower) pero **brutalmente desigual**.
- **La realidad cruda (RevenueCat 2026, sobre 115.000 apps):** la app de suscripción mediana hace **~8.300 $/mes a los 18 meses**, pero **~83% nunca llegan a 1.000 $/mes** y **~95% nunca a 10.000 $/mes** en 2 años. El top 5% gana **~400×** el cuartil bajo. Las apps anteriores a 2020 acaparan el **69%** de los ingresos; las nacidas en 2025+ solo el **3%**. La incumbencia es un foso.
- **El nicho fitness monetiza ~2× mejor que la media… pero es "winner-take-most":** solo **~5% de las apps de salud/fitness superan 10.000 $ de ingresos *totales* en sus 2 primeros años.** Los líderes (Strong, Hevy, MacroFactor, Fitbod, MyFitnessPal) están atrincherados y consolidando (MyFitnessPal **compró Cal AI** en dic. 2025).
- **La paradoja de Temple:** su mayor virtud (local-first + clave Gemini del propio usuario → **coste de servidor ≈ 0**) es a la vez su debilidad de ingresos: ser una **PWA gratis sin tienda** renuncia justo a los dos canales donde este nicho gana dinero — **el descubrimiento de la App Store** y **el billing de la tienda con pruebas gratis**.
- **El encaje más limpio:** *núcleo gratis + desbloqueo de pago único ("lifetime") ~10–25 €* para analítica avanzada / generador de dietas / sync en la nube, vendido con el argumento **"págalo una vez, tus datos en tu dispositivo, tu propia clave de IA, sin suscripción ni publicidad ni vigilancia"** — explotando directamente la fatiga de suscripción y de privacidad de MyFitnessPal/Cal AI. Temple **puede** ofrecer "lifetime" porque no carga coste por usuario; MacroFactor literalmente no puede.
- **Expectativa honesta:** trátalo como **proyecto de reputación/comunidad** con un ingreso *adicional* realista de **decenas a pocos cientos de €/mes** si construye una audiencia fiel — no como sustituto de un salario. La excepción (Hevy) tardó ~5–6 años y un motor orgánico implacable.

---

## 1. El mercado de apps en 2026

| Métrica | Cifra 2025 | Fuente |
|---|---|---|
| Gasto in-app global (juegos + no-juegos) | **167.000 M$** (+10,6%) | Sensor Tower, *State of Mobile 2026* |
| Gasto en apps **no-juego** | **~85.000 M$** (+21%) | Sensor Tower / TechCrunch |
| Descargas totales | **149.000 M** (+0,8%) | Sensor Tower |
| Ingresos in-app de apps de IA | **>5.000 M$** (×3 interanual) | Sensor Tower |
| ChatGPT (solo IAP) | **3.400 M$** en 2025 | TechCrunch |

**El cambio estructural de 2025:** por primera vez, a nivel global, **se gastó más en apps que no son juegos que en juegos.** El motor son las suscripciones (IA, productividad, salud) — no los juegos. La IA es la categoría que más crece, pero con la **peor retención**.

### La cola larga (los números que nadie te cuenta)
- App de suscripción mediana: **~8,3K $ MRR a los 18 meses**. Top 5%: **>1,16M $ MRR**.
- **Solo 17,3% llega a 1.000 $ MRR en 2 años. Solo 4,6% a 10.000 $.**
- Top 25% creció **+80% interanual**; cuartil inferior **−33%** (encogiendo).
- Apps **anteriores a 2020 = 69%** de todos los ingresos de suscripción. Nacidas en 2025+ = **3%**.

---

## 2. Modelos de monetización y sus *benchmarks*

| Modelo | Cómo funciona | Benchmark real |
|---|---|---|
| **Pago adelantado (una vez)** | Cobrar antes de descargar | **Prácticamente muerto**: mata el embudo (nadie prueba), sin LTV recurrente |
| **Freemium → suscripción** (sin muro duro) | App gratis, premium opcional | Conversión gratis→pago **~2,1%** (D35). Revenue/instalación D60: **0,38 $** |
| **Hard paywall** (prueba/suscripción para usar) | Muro desde el inicio | Conversión prueba→pago **~10,7%** (×5 el freemium). Revenue/instalación D60: **3,09 $** (×8). Misma retención a 1 año |
| **IAP consumibles** (créditos, monedas) | Packs de uso | Motor de juegos y apps de IA (créditos). Concentrado en "whales" |
| **Publicidad** (rewarded/intersticial/banner) | Anuncios | eCPM rewarded EE.UU. **~16–20 $**; LatAm **~2–4 $**. ARPDAU realista **0,02–0,10 $**. *Solo funciona a escala masiva* |
| **Híbrido** (sub + ads + IAP) | Combinado | Solo **~10%** de apps; mayor techo, más difícil de ejecutar |
| **Lifetime / desbloqueo único como IAP** | Pago único no-consumible | Captura a los reacios a suscribirse; **topa el LTV** pero da caja y diferenciación |

**Datos finos que importan:**
- **Pruebas largas convierten mejor:** 17–32 días → **42,5%**; <4 días → **25,5%**. Pero **el 50% de las conversiones pasan el Día 0**.
- **Mix por categoría:** Salud y Fitness vende **~68% planes anuales**. Los anuales renuevan al **83,4%** una vez llegan… pero **72% de los anuales cancelan en el Año 1** (35% en el primer mes).
- **LTV mediano por pagador (Año 1):** global ~**23 $**; Europa Occidental ~**26,6 $**; apps de IA ~**30 $** (pero churn 36% peor).

---

## 3. Economía de las tiendas y la UE (DMA)

| | Apple App Store | Google Play |
|---|---|---|
| Cuenta dev | **99 $/año** | **25 $ una vez** |
| Comisión estándar | 30% | 30% (>1M$) |
| Comisión reducida | **15%** (Small Business <1M$/año) | **15%** primer millón |
| Suscripciones | 30% año 1 → **15%** tras 12 meses | **15% desde el día 1** |

- **Merchant of Record (clave):** en compras dentro de la tienda, **Apple y Google calculan, cobran y liquidan el IVA/impuestos** del país del comprador. Es un servicio enorme que justifica buena parte del 15–30%. Si sacas el pago **fuera** de la tienda, **pierdes esa red de seguridad fiscal**.
- **DMA en la UE (2024–2026):** ahora se permite *sideloading*, tiendas alternativas y enlaces de pago externos en iOS. Pero Apple respondió con tasas (Core Technology Fee/Commission ~5%) que, para un *indie*, **casi nunca hacen rentable salir de la App Store**. El DMA beneficia sobre todo a los **grandes**.

---

## 4. El nicho fitness en detalle

**Tamaño:** ~**12–18.000 M$ en 2025**, CAGR ~**13–26%**. Europa ~3,3–3,8.000 M$ (CAGR ~24%). **España crece más lento (~14,4% CAGR)** y con **churn altísimo (~82% cancela en 3 meses)** — mercado más difícil de monetizar que EE.UU. **LatAm** crece ~28% (relevante para el mercado hispanohablante).

### Competidores directos (precios y modelo)

| App | Mensual | Anual | Lifetime | Tier gratis | Qué hay tras el muro |
|---|---|---|---|---|---|
| **Strong** | ~9,99 $ | ~49–60 $ | — | Generoso (tope 3 rutinas) | Rutinas + analítica |
| **Hevy** | **3,99 $** | ~49,99 $ | **~74,99 $** | Generoso | Rutinas/historial ilimitados |
| **MacroFactor** | 11,99 $ | 71,99 $ | **Ninguno (lo rechaza)** | **Ninguno** | Toda la app (algoritmo TDEE) |
| **Fitbod** | 15,99 $ | 95,99 $ | ~359 $ | 3 entrenos | Generador de plan IA |
| **Cal AI** | ~9,99 $ | ~29,99 $ | — | Solo prueba | Escaneo de macros por foto IA |
| **MyFitnessPal** | 19,99/24,99 $ | 79,99/99,99 $ | — | Gratis (recortado) | **Escáner de código de barras**, macros |

**Las dos historias clave:**
- **Hevy** (el sueño *indie*, bootstrapped, equipo ~8–13): de ~20K $/mes (2022) a **~600–800K $/mes** (2025–26), **sin marketing de pago** (77% orgánico). Tardó **~5–6 años**. Mantiene el **lifetime ~74,99 $** incluso a escala. Es el análogo más directo del núcleo de fuerza de Temple.
- **Cal AI** (dos jóvenes, bootstrapped): **8M$ ARR (2024) → ~35M$ (2025) → ~50M$ (mar. 2026)**, vendida a **MyFitnessPal** (~50M$). Su gancho — **estimar macros por foto** — **es exactamente la función que Temple ya tiene** (pero gratis y con la clave del usuario). *Aviso:* Apple la **retiró en abril 2026** por un *paywall* engañoso → cuidado con precios oscuros.

### Qué pagan de verdad los usuarios de fitness
Salud y Fitness es **la categoría que mejor monetiza** (prueba→pago mediana **~40%**, ARPU/instalación de las más altas). Convierten:
1. **Personalización/IA** (planes adaptativos, coaching, foto→macros): pagan por *no pensar*.
2. **Quitar fricción** (escáner de código de barras —MFP lo hizo su muro nº1—, registro rápido, ilimitados).
3. **Analítica y progreso** (gráficas a largo plazo, 1RM, volumen).
4. **Onboarding con prueba** = mejor conversión.

### Huecos de mercado abiertos (y su trampa)
1. **Privacidad / local-first** → el diferenciador más fuerte de Temple, pero "local-first" no se busca activamente (nicho dentro del nicho).
2. **Reacción anti-MyFitnessPal** (escáner de código de barras gratis con Open Food Facts, fuerte en la UE) → hueco concreto con "villano" identificado.
3. **Accesibilidad (WCAG)** → casi nadie la trabaja; señal de calidad más que driver de conversión. La **European Accessibility Act** (junio 2025) la empuja.
4. **Español / UE primero** → estudio JMIR 2024: de 1.460 apps de nutrición en español, **solo 42** cumplían criterios de calidad. Competidor a estudiar: **Fitia**.
5. **Anti-suscripción / pago único** → demanda real (fatiga de suscripción), viable como *posicionamiento*, difícil como *modelo* a escala.

---

## 5. Diagnóstico de Temple para monetizar

**A favor**
- Producto ya construido, pulido, testeado, accesible, con features que el mercado **cobra en premium** (rutinas ilimitadas, historial, export, generador de dietas, foto→macros).
- **Coste marginal por usuario ≈ 0** (local-first + clave IA del usuario) → **habilita un modelo "lifetime" que MacroFactor no puede ofrecer**.
- Historia de marca coherente y diferenciada (privacidad, accesibilidad, español, sin ads).

**En contra**
- **PWA sin tienda = sin descubrimiento orgánico** (el canal nº1 del nicho). Tú generas *cada* instalación.
- **Gratis por diseño, sin muro** → superficie monetizable hoy ≈ 0 €.
- **iOS hostil a las PWA:** push solo si se instala en pantalla de inicio; **IndexedDB se purga a los 7 días** en pestañas Safari (las PWA instaladas se libran → hay que empujar "Añadir a inicio" + export/backup).
- Añadir un tier de pago **roza la contradicción** con el posicionamiento "todo gratis". Hay que enmarcarlo como *apoyar el proyecto / extras opcionales*, no recortar lo que hoy es gratis.

---

## 6. Caminos técnicos concretos (orden de menor a mayor dolor)

### 6.1 Cobrar en la web (recomendado para empezar)
**Usa un Merchant-of-Record (MoR), NO Stripe a pelo.** El MoR es el vendedor legal y **gestiona el IVA UE y los impuestos globales por ti**.

| Proveedor | Comisión | ¿MoR (gestiona IVA)? | Nota |
|---|---|---|---|
| **Stripe** | 2,9% + 0,30 € (+~0,7% Billing) | **No** (tú liquidas IVA/OSS) | Más barato %, pero te comes el papeleo fiscal |
| **Paddle** | 5% + 0,50 $ todo incluido | **Sí** | Mejor cobertura fiscal; bueno con muchos subs internacionales |
| **Lemon Squeezy** | 5% + 0,50 $ | **Sí** | Maduro, ahora de Stripe; gran DX |
| **Polar** | 5% + 0,50 $ | **Sí** | API más *developer-friendly*, webhooks limpios |
| **Gumroad** | ~10% | **Sí** | Lo más simple, el más caro; ideal para producto único |

→ **Para Temple: Polar o Lemon Squeezy.** Quitan el IVA de encima y encajan con venta digital de un *indie* en la UE.

### 6.2 Gatear features sin backend (local-first)
**Token de licencia firmado (JWT) — el mejor encaje.** Al comprar, el MoR dispara un webhook → generas un **JWT firmado con tu clave privada** (`{plan, expiry}`). La PWA lleva solo la **clave pública** y **verifica offline**. Sin secreto en el cliente, funciona sin red. (Un usuario avanzado puede parchearlo, pero monetizas a los honestos.) Si algún día vas a móvil, cambia a **RevenueCat** para unificar web+iOS+Android.

### 6.3 Distribución en tiendas (solo si la web tracciona)
- **Microsoft Store:** la más fácil y **gratis** vía PWABuilder (~24–48 h de revisión). Hazlo.
- **Google Play (TWA):** viable; un TWA **puede** usar Play Billing (Digital Goods API). Coste: 25 $ + 15% + **mantener la Billing Library al día** (v8 obligatoria ago. 2026). Solo compensa con volumen Android real.
- **iOS:** lo más doloroso. Una PWA pura **no entra**; un *wrapper* fino lo **rechazan** (guía 4.2). Hacerlo bien = **Capacitor + carcasa nativa + HealthKit + StoreKit + 99 $/año** + batallas de revisión. Solo cuando la web demuestre demanda.

### 6.4 Tier "nube/sync" de pago (cuando haya demanda)
- **Supabase** (Postgres + Auth + RLS): **mejor encaje** con el modelo Dexie. Gratis para prototipar (ojo: se pausa a la semana de inactividad) → **25 $/mes** Pro cuando haya pagadores.
- **Cloudflare** (Workers + D1 + R2, sin coste de egress): más barato a escala, más montaje manual.

### 6.5 Coste de la IA si la alojas tú (premium)
Gemini factura las imágenes como tokens de entrada. **Coste por escaneo:**
- **Gemini 2.5 Flash-Lite:** **~0,0002 $** (≈ 0,22 $ / 1.000 escaneos).
- **Gemini 2.5 Flash:** **~0,001 $** (≈ 1,05 $ / 1.000 escaneos).

→ El coste de tokens es **despreciable**. El riesgo real es el **abuso** (limita escaneos/día) y tu tiempo. Modelo sensato: **gratis = trae tu propia clave** (statu quo, 0 € para ti); **premium = clave alojada** con tope mensual (la clave Gemini **siempre en servidor**, nunca en el cliente — un Edge Function de Supabase o un Worker).

---

## 7. Fiscalidad y legal en España (informativo — consulta un gestor)

### Mito vs. realidad del alta de autónomo
- **Alta censal en Hacienda (modelo 036): SIEMPRE obligatoria** antes del primer ingreso. (El 037 desapareció en feb. 2025.) Es **independiente** de la Seguridad Social.
- **Alta de autónomo (RETA): depende de la "habitualidad", NO del SMI.** El **Tribunal Supremo (STS 941/2025)** aclaró que **no hay un mínimo de ingresos automático** que libere del RETA; el SMI es solo un **indicio**. **Una app con ingresos recurrentes mes a mes = habitual → muy probablemente obliga al alta**, aunque los importes sean pequeños.
- **Riesgo de no registrarse:** alta de oficio retroactiva + cuotas atrasadas + recargo (~20%) + sanciones (hasta ~3.000 €).

### Costes de autónomo (2025–2026)
- **Tarifa plana: 80 €/mes los primeros 12 meses** (prorrogable a 24 si los rendimientos netos < SMI).
- Después, **cotización por ingresos reales** (tramos): tramo 1 (<670 €/mes neto) ≈ **205 €/mes**. SMI ref. 2026: **1.221 €/mes × 14 = 17.094 €/año**.

### IVA según el canal (la parte más confusa)
- **Vía App Store/Google Play o un MoR (Paddle/Lemon Squeezy/Polar):** ellos son merchant of record → **gestionan el IVA**. Tú no repercutes IVA al usuario final. Con App Store/Play/AdSense (entidades UE) necesitas **alta en ROI/VIES** y declarar en **modelos 303 y 349** (operación intracomunitaria, inversión del sujeto pasivo).
- **Vía Stripe directo (tú eres merchant of record):** debes cobrar el **IVA del país de cada consumidor UE** → régimen **OSS / modelo 369** (umbral 10.000 €/año). Mucho más papeleo.
- **EE.UU. (Apple/Google/ads):** rellena el **W-8BEN** con tu NIF para evitar la retención del 30% (Convenio España-EE.UU.; venta de apps suele tratarse como *business profits* → 0%).

### IRPF
Rendimiento de actividad económica (base general). **Modelo 130** trimestral (20% del rendimiento neto; probable que aplique porque las plataformas extranjeras no retienen) + **Renta** anual. Como ingreso *adicional* a una nómina, tributa a tu **tipo marginal** actual.

### RGPD y accesibilidad
- Datos de **salud/fitness = categoría especial** (art. 9 RGPD) → cautela reforzada. Necesitas **política de privacidad + consentimiento de cookies (Guía AEPD)** si recoges cualquier dato/analítica. Temple, al ser local-first sin rastreo, **parte con ventaja** aquí.
- **European Accessibility Act** (junio 2025, Ley 11/2023): exige WCAG 2.1 AA a servicios digitales; **microempresas (<10 empleados, <2M€) exentas** de lo más estricto — pero Temple ya cumple 2.2 AA, así que es un **argumento de venta**.

### Camino de cumplimiento mínimo viable
1. **Empezar con un MoR o vía tiendas** → se ocupan del IVA. Evita Stripe directo al principio.
2. **Alta censal 036** antes del primer ingreso (innegociable).
3. **Valorar el RETA con un gestor** (probable, con tarifa plana de 80 €/mes).
4. **Gestor/asesoría** (~50–80 €/mes): casi siempre sale a cuenta.

---

## 8. Estrategia recomendada para Temple (plan por fases)

**Modelo elegido: "Open core" + desbloqueo de pago único (lifetime) + tier nube opcional.** Encaja con coste ≈ 0, con la fatiga de suscripción, y no recorta lo que hoy es gratis.

- **Fase 0 — Validar demanda (sin cobrar):** publica la PWA, mide instalaciones a pantalla de inicio, retención y qué features se usan. Añade **export/backup** robusto (mitiga la purga de IndexedDB en iOS). Construye audiencia (contenido en español, Reddit, comunidades de fuerza). *El cuello de botella es la distribución, no el producto.*
- **Fase 1 — Primer dinero, mínima burocracia:** "**Temple Pro — pago único ~12–20 €**" desbloqueando *extras opcionales* (temas, analítica avanzada, generador de dietas, sin límites) vía **Polar/Lemon Squeezy + JWT firmado**. Mensaje: *"Apoya el proyecto. Una vez. Tus datos en tu dispositivo. Sin suscripción, sin ads, sin vigilancia."* Alta censal 036 + W-8BEN si aplica.
- **Fase 2 — Tier recurrente con valor real:** **Sync en la nube multi-dispositivo + copia de seguridad + (opcional) escaneo IA alojado** = suscripción baja (3–5 €/mes o ~30 €/año) con **Supabase**. Esto SÍ justifica recurrencia (resuelve la purga de iOS y el multi-dispositivo). Aquí ya valora el alta de autónomo en serio.
- **Fase 3 — Tiendas (solo si hay tracción):** Microsoft Store (gratis) → Google Play TWA → iOS con Capacitor + HealthKit + StoreKit (+ RevenueCat para unificar). Cada paso solo si los números de la fase anterior lo justifican.

**Complemento de bajo riesgo:** el README ya posiciona Temple como **pieza de portfolio**. El mayor "ingreso adicional" probable a corto plazo no es la app en sí, sino **lo que la app te abre**: empleo/freelance frontend (TypeScript estricto + a11y + arquitectura por capas es muy vendible), o convertir el conocimiento en contenido (tutoriales "cómo construí una PWA local-first").

---

## 9. Expectativas realistas y riesgos

- **Resultado modal de una app nueva indie: 0–100 €/mes.** Planifica el fracaso como caso base; construye barato y lanza muchos tiros (o uno muy bien distribuido).
- **El CAC mata las unidades:** instalar cuesta 4–27 $ según categoría; el revenue medio por instalación suele ser <1 $. **La adquisición de pago pierde dinero** para casi todos los indies → tu única vía viable es **orgánico/contenido/comunidad** (como hizo Hevy).
- **Riesgo de posicionamiento:** monetizar puede chocar con la promesa "todo gratis" del README. Mitígalo: nunca recortes lo actual; cobra solo extras/nube.
- **España es mercado duro** (churn 82% en 3 meses, CAGR menor). Mira a **LatAm** y al público hispanohablante global.
- **Plataforma:** una PWA gratis sin tienda parte por debajo de los (ya bajos) *benchmarks* nativos. El salto a tiendas multiplica esfuerzo y comisiones.

---

## 10. Próximos pasos accionables

1. **Decidir el objetivo real:** ¿ingreso (entonces, distribución agresiva + Pro de pago) o portfolio/empleo (entonces, pulir, publicar, escribir sobre ello)? Cambia toda la estrategia.
2. **Publicar y medir** (Fase 0) antes de escribir una línea de código de pago.
3. **Si monetizas:** abre cuenta en **Polar o Lemon Squeezy**, implementa **JWT de licencia**, define el **Pro de pago único**.
4. **Consultar un gestor** sobre RETA (habitualidad) e IVA según el canal elegido.
5. **Reforzar la retención local** (export/backup + empujar "Añadir a inicio") para no perder datos en iOS.

---

### Fuentes principales
Sensor Tower *State of Mobile 2026*; RevenueCat *State of Subscription Apps 2025/2026*; Adapty *Health & Fitness Benchmarks 2026*; Apple/Google developer docs; Apple DMA/EU; Polar/Lemon Squeezy/Paddle/Stripe pricing; Supabase/Cloudflare/Gemini pricing; getLatka/Sensor Tower (Hevy, Fitbod, Cal AI); TechCrunch/CNBC (Cal AI, MyFitnessPal); JMIR 2024 (apps nutrición en español); Tribunal Supremo STS 941/2025; AEPD; infoautónomos; Agencia Tributaria (modelos 036/130/303/349/369); IRS W-8BEN. *(URLs completas en los informes de investigación de cada área.)*
