# Prompts para las ilustraciones de grupos musculares

**Objetivo:** una ilustración por ejercicio (52) que destaque el músculo trabajado, con estilo
coherente con ForjaFit (fondo hierro `#14161a`, naranja brasa `#f97316`, teal `#2dd4bf`).
Generadas por ti con cualquier modelo de imagen (Gemini/Nano Banana, ChatGPT, Flux, Ideogram…):
al crearlas tú, no hay riesgo de licencias de terceros (el problema que descartó los datasets
scrapeados, ver informe §4).

---

## Cómo usarlos (importante para la coherencia del set)

1. **Genera primero `sentadilla`** (el ejemplo completo de abajo). Itera hasta que el estilo te guste.
2. **Usa esa primera imagen como referencia de estilo** para todas las demás. En modelos que
   aceptan imagen de referencia, adjúntala y añade al prompt:
   > *"Mantener exactamente el estilo visual, paleta, trazo y fondo de la imagen de referencia. Cambiar solo a: [BLOQUE DEL EJERCICIO]."*
3. **Misma sesión/chat para todo el set** si tu herramienta mantiene contexto; cambia UNA cosa
   por iteración (regla de oro: una variable cada vez).
4. **Formato:** cuadrado 1:1, genera a 1024×1024 y exporta a **WebP 512×512** (pesa poco para la PWA).
5. **Nombre de archivo = id del ejercicio** (lo tienes en cada bloque): `press-banca.webp`,
   `sentadilla.webp`… y guárdalas en `public/musculos/`. Así el cableado en la app será automático.
6. En la app serán **decorativas** (`alt=""`): el grupo muscular ya está como texto — la imagen
   suma para quien ve, no sustituye a nada para quien no.

---

## PLANTILLA BASE (el bloque fijo de TODOS los prompts)

```
Ilustración anatómica minimalista estilo vector flat para la interfaz de una app móvil de
fitness. Figura humana de cuerpo entero, género neutro, sin rostro ni cabello detallados,
musculatura esquemática delineada con trazo limpio gris claro (#a9b0bb) y relleno gris hierro
(#262a31), sobre fondo oscuro liso (#14161a). [VISTA]. Los músculos protagonistas resaltados
en naranja brasa (#f97316) con un sutil resplandor exterior; los músculos secundarios en verde
azulado (#2dd4bf) sin resplandor. El resto del cuerpo permanece neutro y apagado. Figura
centrada con aire alrededor, formato cuadrado 1:1, estilo coherente de set de iconografía
médica moderna. Sin texto, sin etiquetas, sin marcas de agua, sin sombras proyectadas, sin
degradado de fondo, sin 3D, sin fotorrealismo.
```

**Prompt final de cada ejercicio = PLANTILLA BASE sustituyendo `[VISTA]` e insertando su BLOQUE.**

### Ejemplo completo montado (sentadilla)

```
Ilustración anatómica minimalista estilo vector flat para la interfaz de una app móvil de
fitness. Figura humana de cuerpo entero, género neutro, sin rostro ni cabello detallados,
musculatura esquemática delineada con trazo limpio gris claro (#a9b0bb) y relleno gris hierro
(#262a31), sobre fondo oscuro liso (#14161a). Vista frontal anatómica, brazos ligeramente
separados del cuerpo. Los músculos protagonistas resaltados en naranja brasa (#f97316) con un
sutil resplandor exterior: los cuádriceps de ambas piernas. Los músculos secundarios en verde
azulado (#2dd4bf) sin resplandor: glúteos (borde visible del costado) y zona lumbar. El resto
del cuerpo permanece neutro y apagado. Figura centrada con aire alrededor, formato cuadrado
1:1, estilo coherente de set de iconografía médica moderna. Sin texto, sin etiquetas, sin
marcas de agua, sin sombras proyectadas, sin degradado de fondo, sin 3D, sin fotorrealismo.
```

---

## Los 52 bloques por ejercicio

Solo hay dos vistas en todo el set (otra clave de coherencia):
- **VISTA F** = "Vista frontal anatómica, brazos ligeramente separados del cuerpo."
- **VISTA P** = "Vista posterior anatómica (de espaldas), brazos ligeramente separados del cuerpo."

### Pecho

| Archivo | Vista | EN NARANJA (protagonista) | EN TEAL (secundarios) |
|---|---|---|---|
| `press-banca.webp` | F | pectoral mayor completo, ambos lados | tríceps y deltoides anterior |
| `press-banca-inclinado.webp` | F | porción superior (clavicular) del pectoral | deltoides anterior y tríceps |
| `press-mancuernas.webp` | F | pectoral mayor completo | tríceps y deltoides anterior |
| `aperturas-mancuernas.webp` | F | pectoral mayor completo | deltoides anterior |
| `flexiones.webp` | F | pectoral mayor completo | tríceps y zona abdominal |
| `cruce-poleas.webp` | F | porción inferior y esternal del pectoral | deltoides anterior |
| `press-pecho-maquina.webp` | F | pectoral mayor completo | tríceps |

### Espalda

| Archivo | Vista | EN NARANJA | EN TEAL |
|---|---|---|---|
| `dominadas.webp` | P | dorsal ancho, ambos lados (forma de V) | bíceps y romboides |
| `jalon-al-pecho.webp` | P | dorsal ancho, ambos lados | bíceps |
| `remo-barra.webp` | P | dorsal ancho y romboides | trapecio medio, bíceps y zona lumbar |
| `remo-mancuerna.webp` | P | dorsal ancho del lado derecho | romboides y bíceps derechos |
| `remo-polea-baja.webp` | P | dorsal ancho y romboides | bíceps y trapecio medio |
| `pullover-mancuerna.webp` | P | dorsal ancho, ambos lados | tríceps |
| `encogimientos.webp` | P | trapecio superior, ambos lados | — (sin secundarios) |

### Hombros

| Archivo | Vista | EN NARANJA | EN TEAL |
|---|---|---|---|
| `press-militar.webp` | F | deltoides anterior y medio, ambos hombros | tríceps y trapecio superior |
| `press-hombro-mancuernas.webp` | F | deltoides completo, ambos hombros | tríceps |
| `elevaciones-laterales.webp` | F | deltoides medio (cara lateral del hombro) | trapecio superior |
| `elevaciones-frontales.webp` | F | deltoides anterior | porción superior del pectoral |
| `pajaros.webp` | P | deltoides posterior, ambos hombros | romboides y trapecio medio |
| `face-pull.webp` | P | deltoides posterior, ambos hombros | trapecio y zona de los rotadores del hombro |

### Bíceps (todas VISTA F)

| Archivo | EN NARANJA | EN TEAL |
|---|---|---|
| `curl-barra.webp` | bíceps de ambos brazos | antebrazos |
| `curl-mancuernas.webp` | bíceps de ambos brazos | antebrazos |
| `curl-martillo.webp` | bíceps y cara externa del antebrazo (braquiorradial) | — |
| `curl-polea.webp` | bíceps de ambos brazos | antebrazos |
| `curl-scott.webp` | bíceps de ambos brazos | antebrazos |

### Tríceps

| Archivo | Vista | EN NARANJA | EN TEAL |
|---|---|---|---|
| `press-frances.webp` | P | tríceps de ambos brazos | — |
| `extension-triceps-polea.webp` | P | tríceps de ambos brazos | — |
| `fondos-paralelas.webp` | F | tríceps (borde posterior visible de ambos brazos) | pectoral inferior y deltoides anterior |
| `patada-triceps.webp` | P | tríceps del brazo derecho | — |
| `press-cerrado.webp` | F | tríceps (borde posterior visible de ambos brazos) | pectoral |

### Pierna

| Archivo | Vista | EN NARANJA | EN TEAL |
|---|---|---|---|
| `sentadilla.webp` | F | cuádriceps de ambas piernas | glúteos (borde del costado) y zona lumbar |
| `sentadilla-frontal.webp` | F | cuádriceps de ambas piernas | zona abdominal |
| `sentadilla-goblet.webp` | F | cuádriceps de ambas piernas | glúteos (borde del costado) |
| `prensa-piernas.webp` | F | cuádriceps de ambas piernas | glúteos (borde del costado) |
| `zancadas.webp` | F | cuádriceps de la pierna adelantada | glúteo e isquiotibial (borde del costado) |
| `extension-cuadriceps.webp` | F | cuádriceps de ambas piernas | — |
| `curl-femoral.webp` | P | isquiotibiales de ambas piernas | gemelos |
| `peso-muerto-rumano.webp` | P | isquiotibiales de ambas piernas | glúteos y zona lumbar |
| `elevacion-gemelos.webp` | P | gemelos de ambas piernas | — |

### Glúteo (todas VISTA P)

| Archivo | EN NARANJA | EN TEAL |
|---|---|---|
| `hip-thrust.webp` | glúteo mayor, ambos lados | isquiotibiales |
| `puente-gluteo.webp` | glúteo mayor, ambos lados | isquiotibiales y zona lumbar |
| `patada-gluteo-polea.webp` | glúteo mayor del lado derecho | isquiotibial derecho |

### Core (todas VISTA F)

| Archivo | EN NARANJA | EN TEAL |
|---|---|---|
| `plancha.webp` | recto abdominal completo | hombros y glúteos (borde del costado) |
| `plancha-lateral.webp` | oblicuos del costado derecho | hombro derecho |
| `crunch.webp` | porción superior del recto abdominal | — |
| `elevaciones-piernas.webp` | porción inferior del recto abdominal | flexores de la cadera |
| `rueda-abdominal.webp` | recto abdominal completo | dorsales (borde del costado) y hombros |
| `giro-ruso.webp` | oblicuos de ambos costados | recto abdominal |

### Cuerpo completo

| Archivo | Vista | EN NARANJA | EN TEAL |
|---|---|---|---|
| `peso-muerto.webp` | P | glúteos, isquiotibiales y zona lumbar | trapecio y antebrazos |
| `kettlebell-swing.webp` | P | glúteos e isquiotibiales | zona lumbar y hombros |
| `burpees.webp` | F | pectoral, cuádriceps y recto abdominal (resalte repartido) | hombros |
| `remo-renegado.webp` | P | dorsal ancho, ambos lados | oblicuos (borde del costado) y tríceps |

---

## Restricciones que ya van en la plantilla (no las quites)

- **Sin texto ni etiquetas**: los modelos meten rótulos anatómicos si no se les prohíbe.
- **Sin 3D/fotorrealismo**: fuerza el flat vectorial que encaja con la UI.
- **Sin degradado de fondo / sombras**: el fondo debe fundirse con las tarjetas de la app.
- **Género neutro y sin rostro**: set inclusivo y sin "cara de IA" que envejezca mal.

## Solución de problemas

| Problema | Ajuste |
|---|---|
| El naranja se va a rojo/amarillo | Repite el hex al final: "el resalte es exactamente #f97316" |
| Resalta el músculo equivocado | Nombra el músculo Y su ubicación: "cuádriceps, en la cara FRONTAL del muslo" |
| Cada imagen sale con un estilo | Usa la primera buena como referencia de estilo (paso 2 de Cómo usarlos) |
| Mete fondo degradado | Añade "fondo de color sólido uniforme, plano, sin viñeteado" |
| La figura sale recortada | Añade "cuerpo entero visible de cabeza a pies, con margen alrededor" |

## Cableado futuro en la app (cuando tengas las imágenes)

1. Carpeta `public/musculos/` con los 52 `.webp`.
2. En `ExercisesView` y `ExercisePicker`: `<img src={`./musculos/${exercise.id}.webp`} alt="" loading="lazy" onError={ocultar} />` — decorativa (el grupo muscular ya está en texto) y con fallback si falta alguna.
3. Añadir `musculos/*.webp` al `globPatterns` del precache en `vite.config.ts` para que funcionen offline.

Pídeme el cableado cuando tengas las primeras imágenes generadas.
