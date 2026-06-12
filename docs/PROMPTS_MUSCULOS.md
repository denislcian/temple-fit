# Prompts para las ilustraciones de grupos musculares

**Objetivo:** una ilustración por ejercicio (52) que destaque el músculo trabajado, con estilo
coherente con Temple (fondo hierro `#14161a`, naranja brasa `#f97316`, teal `#2dd4bf`).
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

## Prompts listos para copiar (usar CON la imagen de referencia de estilo)

> Las tablas de arriba son el mapa; estos son los prompts montados. Cada uno es autocontenido:
> color + músculo en la misma frase y negaciones cruzadas para evitar inversiones de color.
> **Recuerda: formato 1:1 en tu herramienta.**

Estructura común (no la cambies): *"Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia."* + vista + naranja + teal + neutro + *"Sin texto, sin etiquetas. Formato cuadrado 1:1."*

### Pecho

**press-banca.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el pectoral mayor completo de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides anteriores (cara frontal de ambos hombros) y tríceps (borde posterior de ambos brazos). El pecho NO es verde azulado; hombros y brazos NO son naranjas. Resto del cuerpo neutro, sin otros colores. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**press-banca-inclinado.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE la porción SUPERIOR (clavicular) del pectoral, ambos lados; la parte baja del pecho queda neutra. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides anteriores y tríceps. Hombros NO naranjas. Resto del cuerpo neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**press-mancuernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el pectoral mayor completo de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: tríceps y deltoides anteriores. El pecho NO es verde azulado. Resto del cuerpo neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**aperturas-mancuernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el pectoral mayor completo de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: solo los deltoides anteriores. Brazos y abdomen neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**flexiones.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el pectoral mayor completo. EN VERDE AZULADO (#2dd4bf) sin resplandor: tríceps y recto abdominal. El abdomen es verde azulado tenue, NO naranja. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**cruce-poleas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE la porción INFERIOR y central (esternal) del pectoral, ambos lados; la parte alta del pecho queda neutra. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides anteriores. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**press-pecho-maquina.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el pectoral mayor completo de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: solo los tríceps. Hombros neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Espalda

**dominadas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el dorsal ancho de ambos lados (la gran V de la espalda). EN VERDE AZULADO (#2dd4bf) sin resplandor: bíceps (borde frontal de los brazos) y romboides (centro alto de la espalda). La espalda baja y las piernas neutras. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**jalon-al-pecho.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el dorsal ancho de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: solo los bíceps. Trapecio y lumbar neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**remo-barra.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor: dorsal ancho y romboides. EN VERDE AZULADO (#2dd4bf) sin resplandor: trapecio medio, bíceps y zona lumbar. Piernas neutras. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**remo-mancuerna.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el dorsal ancho del lado DERECHO; el lado izquierdo de la espalda queda neutro. EN VERDE AZULADO (#2dd4bf) sin resplandor: romboides y bíceps del lado derecho. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**remo-polea-baja.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor: dorsal ancho y romboides, ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: bíceps y trapecio medio. Lumbar y piernas neutras. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**pullover-mancuerna.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el dorsal ancho de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: solo los tríceps. Trapecio neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**encogimientos.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el trapecio superior (entre el cuello y los hombros, ambos lados). SIN músculos en verde azulado en esta imagen. Dorsal y resto del cuerpo neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Hombros

**press-militar.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los deltoides (anterior y lateral) de ambos hombros. EN VERDE AZULADO (#2dd4bf) sin resplandor: tríceps y trapecio superior (base del cuello). El pecho NO lleva color. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**press-hombro-mancuernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los deltoides completos de ambos hombros. EN VERDE AZULADO (#2dd4bf) sin resplandor: solo los tríceps. Pecho neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**elevaciones-laterales.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el deltoides LATERAL (la cara externa del hombro, ambos lados). EN VERDE AZULADO (#2dd4bf) sin resplandor: trapecio superior. Brazos y pecho neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**elevaciones-frontales.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el deltoides ANTERIOR (la cara frontal del hombro, ambos lados). EN VERDE AZULADO (#2dd4bf) sin resplandor: porción superior del pectoral. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**pajaros.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el deltoides POSTERIOR (parte trasera del hombro, ambos lados). EN VERDE AZULADO (#2dd4bf) sin resplandor: romboides y trapecio medio. Dorsal neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**face-pull.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el deltoides posterior de ambos hombros. EN VERDE AZULADO (#2dd4bf) sin resplandor: trapecio completo. Dorsal y lumbar neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Bíceps

**curl-barra.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los bíceps de ambos brazos. EN VERDE AZULADO (#2dd4bf) sin resplandor: los antebrazos. Hombros y pecho neutros, NO naranjas. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**curl-mancuernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los bíceps de ambos brazos. EN VERDE AZULADO (#2dd4bf) sin resplandor: los antebrazos. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**curl-martillo.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor: los bíceps Y la cara externa de los antebrazos (braquiorradial), ambos brazos. SIN músculos en verde azulado en esta imagen. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**curl-polea.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los bíceps de ambos brazos. EN VERDE AZULADO (#2dd4bf) sin resplandor: los antebrazos. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**curl-scott.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los bíceps de ambos brazos. EN VERDE AZULADO (#2dd4bf) sin resplandor: los antebrazos. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Tríceps

**press-frances.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los tríceps de ambos brazos (parte trasera del brazo). SIN músculos en verde azulado. Espalda y piernas neutras. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**extension-triceps-polea.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los tríceps de ambos brazos. SIN músculos en verde azulado. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**fondos-paralelas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el borde posterior de ambos brazos (tríceps visto de frente). EN VERDE AZULADO (#2dd4bf) sin resplandor: porción inferior del pectoral y deltoides anterior. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**patada-triceps.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el tríceps del brazo DERECHO; el brazo izquierdo neutro. SIN músculos en verde azulado. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**press-cerrado.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el borde posterior de ambos brazos (tríceps visto de frente). EN VERDE AZULADO (#2dd4bf) sin resplandor: el pectoral. El pecho NO es naranja. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Pierna

**sentadilla.webp** *(tu imagen de referencia — ya la tienes)*

**sentadilla-frontal.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los cuádriceps de ambas piernas. EN VERDE AZULADO (#2dd4bf) sin resplandor: el recto abdominal. Pecho y brazos neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**sentadilla-goblet.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los cuádriceps de ambas piernas. EN VERDE AZULADO (#2dd4bf) sin resplandor: el borde lateral de la cadera (glúteo visto de frente). Abdomen neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**prensa-piernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los cuádriceps de ambas piernas. EN VERDE AZULADO (#2dd4bf) sin resplandor: el borde lateral de la cadera. Resto neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**zancadas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el cuádriceps de la pierna DERECHA; la pierna izquierda neutra. EN VERDE AZULADO (#2dd4bf) sin resplandor: glúteo e isquiotibial derechos (borde lateral del muslo). Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**extension-cuadriceps.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los cuádriceps de ambas piernas. SIN músculos en verde azulado. Todo lo demás neutro. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**curl-femoral.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los isquiotibiales (parte trasera de ambos muslos). EN VERDE AZULADO (#2dd4bf) sin resplandor: los gemelos. Glúteos y espalda neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**peso-muerto-rumano.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los isquiotibiales de ambas piernas. EN VERDE AZULADO (#2dd4bf) sin resplandor: glúteos y zona lumbar. Gemelos neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**elevacion-gemelos.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los gemelos de ambas piernas. SIN músculos en verde azulado. Muslos y espalda neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Glúteo

**hip-thrust.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los glúteos, ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: los isquiotibiales. Lumbar y gemelos neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**puente-gluteo.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los glúteos. EN VERDE AZULADO (#2dd4bf) sin resplandor: isquiotibiales y zona lumbar. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**patada-gluteo-polea.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el glúteo DERECHO; el izquierdo neutro. EN VERDE AZULADO (#2dd4bf) sin resplandor: isquiotibial derecho. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Core

**plancha.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el recto abdominal completo. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides de ambos hombros. Pecho y piernas neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**plancha-lateral.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los oblicuos del costado DERECHO (lateral del abdomen); el costado izquierdo neutro. EN VERDE AZULADO (#2dd4bf) sin resplandor: el deltoides derecho. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**crunch.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE la porción SUPERIOR del recto abdominal; la parte baja del abdomen neutra. SIN músculos en verde azulado. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**elevaciones-piernas.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE la porción INFERIOR del recto abdominal (bajo vientre). EN VERDE AZULADO (#2dd4bf) sin resplandor: los flexores de la cadera (pliegue entre abdomen y muslo). Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**rueda-abdominal.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el recto abdominal completo. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides y el borde lateral del torso (dorsal visto de frente). Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**giro-ruso.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE los oblicuos de AMBOS costados del abdomen. EN VERDE AZULADO (#2dd4bf) sin resplandor: el recto abdominal central. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

### Cuerpo completo

**peso-muerto.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor: glúteos, isquiotibiales y zona lumbar (toda la cadena posterior central). EN VERDE AZULADO (#2dd4bf) sin resplandor: trapecio y antebrazos. Gemelos neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**kettlebell-swing.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor: glúteos e isquiotibiales. EN VERDE AZULADO (#2dd4bf) sin resplandor: zona lumbar y deltoides posteriores. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**burpees.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista frontal. EN NARANJA (#f97316) con sutil resplandor, repartido: pectoral, cuádriceps y recto abdominal. EN VERDE AZULADO (#2dd4bf) sin resplandor: deltoides. Brazos neutros. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

**remo-renegado.webp**
```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la imagen de referencia. Vista POSTERIOR (figura de espaldas). EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE el dorsal ancho de ambos lados. EN VERDE AZULADO (#2dd4bf) sin resplandor: oblicuos (borde lateral del torso) y tríceps. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

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
