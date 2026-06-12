# Imágenes de músculos — originales de IA

Esta carpeta guarda los **PNG originales** generados con IA (≈5 MB cada uno).
**No entran en el repo** (están en `.gitignore`): lo que se versiona son las
webp optimizadas de `public/musculos/`, que es lo que usa la app.

## Cómo añadir la imagen de un ejercicio nuevo

1. **Genera la imagen** con el prompt general de abajo (1:1, con tu imagen de
   referencia de estilo — cualquiera de las webp actuales sirve como referencia).
2. **Guarda el PNG aquí** con el **id del ejercicio** como nombre de archivo.
   El id es el primer argumento de `ex('...')` en `src/data/catalog.ts`.
   Vale con guiones o guiones bajos: `press-banca.png` o `press_banca.png`.
3. **Ejecuta el conversor** desde la raíz del proyecto:
   ```
   py scripts/optimize-muscle-images.py
   ```
   Es incremental (solo convierte lo nuevo o modificado), recorta a cuadrado,
   redimensiona a 512px y deja `public/musculos/<id>.webp`. Si el nombre no
   coincide con ningún ejercicio del catálogo te avisa, y al final te dice
   qué ejercicios del catálogo siguen sin imagen.
4. **Comprueba en la app** (`npm run dev` → Ejercicios): la imagen aparece sola —
   el componente `ExerciseImage` busca por id, y si no existe la webp
   simplemente no muestra nada (por eso los ejercicios personalizados no
   enseñan hueco roto).
5. **Commit**: entra la webp nueva de `public/musculos/`, nunca el PNG.

> Si el nombre del archivo no puede coincidir con el id (ya pasó con
> `hip_trust` → `hip-thrust`), añade la pareja al diccionario `RENAMES` de
> `scripts/optimize-muscle-images.py`.

## Prompt general (para generar una imagen nueva)

Con tu **imagen de referencia de estilo** adjunta (modo estilo, no personaje),
rellena los huecos y pega:

```
Mantener exactamente el estilo visual, la paleta, el trazo y el fondo de la
imagen de referencia. Vista [FRONTAL / POSTERIOR (figura de espaldas)].
EN NARANJA (#f97316) con sutil resplandor, ÚNICAMENTE: [músculo protagonista,
con su ubicación anatómica, p. ej. "los cuádriceps, cara frontal de ambos
muslos"]. EN VERDE AZULADO (#2dd4bf) sin resplandor: [músculos secundarios,
o quitar esta frase si no hay]. [Músculo protagonista] NO es verde azulado;
[secundarios] NO son naranjas. Resto del cuerpo neutro y apagado, sin otros
colores. Sin texto, sin etiquetas. Formato cuadrado 1:1.
```

Reglas que evitan los fallos típicos:
- **Color y músculo en la misma frase** (si los separas, el modelo los baraja).
- **Negaciones cruzadas** ("X NO es verde azulado") — corrigen la inversión de
  colores, el error más frecuente.
- **Ubicación anatómica** para músculos que se ven "de canto" (tríceps de
  frente = "borde posterior del brazo").
- **1:1 también en el selector de la herramienta**, no solo en el texto.
- Si la herramienta tiene "mejorar prompt con IA", **desactívalo** (reescribe
  las negaciones).

Los 52 prompts del catálogo actual, ya montados, están en
[docs/PROMPTS_MUSCULOS.md](../../docs/PROMPTS_MUSCULOS.md).
