# Declaración y auditoría de accesibilidad — ForjaFit

**Objetivo de conformidad:** WCAG 2.2 nivel AA
**Última auditoría:** 10 de junio de 2026

ForjaFit trata la accesibilidad como requisito de primera clase, no como un parche final. Ningún competidor del nicho (Strong, Hevy, Jefit, wger…) publicita cumplimiento WCAG; esta app se diseñó para demostrar que un registro de entrenamientos puede ser usable por cualquiera, incluido quien navega con teclado o lector de pantalla.

## Resultados de la auditoría automática

| Comprobación | Herramienta | Resultado |
|---|---|---|
| 6 vistas en tema oscuro | axe-core 4.12.1 (navegador real) | **0 violaciones** |
| Vistas clave en tema claro | axe-core 4.12.1 | **0 violaciones** |
| Estado "entrenamiento en curso" (formulario de series) | axe-core 4.12.1 | **0 violaciones** |
| Diálogo modal abierto (selector de ejercicios) | axe-core 4.12.1 | **0 violaciones** |
| Test de regresión en CI (vista principal) | axe-core + Vitest | **0 violaciones** (se ejecuta en cada push) |
| Tamaño de objetivos táctiles (2.5.8) | Medición de `getBoundingClientRect` | Mínimo real **44×44 px** (el criterio exige 24×24) |

> Las herramientas automáticas detectan solo el 30-40% de los problemas de accesibilidad. Las comprobaciones manuales de abajo cubren el resto.

## Comprobaciones manuales realizadas

- **Navegación por teclado**: todas las funciones operables con Tab/Enter/Espacio; foco visible de alto contraste (anillo ámbar de 3 px) en ambos temas; skip link "Saltar al contenido".
- **Gestión de foco en SPA** (verificada en navegador): al cambiar de vista, el foco se mueve al `<h1>` (`tabindex="-1"`) y una región viva anuncia "Navegado a X". Sin esto, el cambio de ruta es silencioso para un lector de pantalla.
- **Diálogos**: elemento nativo `<dialog>` con `showModal()` → focus trap, cierre con Escape y retorno del foco al disparador, todo nativo del navegador.
- **Responsive**: probado a 375×812 (móvil) y 1280×800; navegación inferior en móvil con targets de 52 px en zona de alcance del pulgar.

## Cómo cada criterio nuevo de WCAG 2.2 se aplica aquí

| Criterio | Implementación en ForjaFit |
|---|---|
| 2.4.11 Focus Not Obscured (AA) | `scroll-padding-top` global del alto de la cabecera sticky: el elemento con foco nunca queda tapado |
| 2.5.7 Dragging Movements (AA) | Reordenar ejercicios de una rutina se hace con botones ↑/↓ accesibles por teclado, no con arrastre |
| 2.5.8 Target Size Minimum (AA) | Variable `--target: 44px` aplicada a botones, checks de serie y navegación (mínimo real medido: 44 px) |
| 3.2.6 Consistent Help (A) | La sección de Ayuda vive en Ajustes, en posición consistente |
| 3.3.7 Redundant Entry (A) | La app **precarga lo que hiciste la última sesión** de cada ejercicio y el botón "añadir serie" copia la anterior. Aquí el criterio coincide con la feature más valorada de un gym log |
| 3.3.8 Accessible Authentication (AA) | No aplica por diseño: no hay login (local-first) |

## Otras decisiones clave (WCAG 2.x base)

- **Formularios** (1.3.1, 3.3.1, 3.3.2): `<label>` visible asociado a cada campo; repeticiones con `type="text" inputmode="numeric" pattern="[0-9]*"` y peso con `inputmode="decimal"` (patrón GOV.UK: `type="number"` incrementa con el scroll y confunde a lectores de pantalla); errores junto al campo con `aria-describedby` + `aria-invalid` y nunca señalados solo con color.
- **Gráficas** (1.1.1, 1.4.1): patrón de tres capas — resumen textual del insight en el cuerpo ("tu 1RM pasó de X a Y, +Z%"), SVG de Recharts con `accessibilityLayer` (navegable por teclado) y toggle "Ver como tabla" con tabla HTML real. Las dos series de la gráfica de progresión se diferencian por trazo (continuo/discontinuo), no solo por color.
- **Contraste** (1.4.3, 1.4.11): paleta verificada AA en ambos temas; el tema oscuro usa gris hierro `#14161a` en lugar de negro puro para evitar *halation* en usuarios con astigmatismo.
- **Estados dinámicos** (4.1.3): el temporizador de descanso anuncia hitos por `aria-live` (30 s, 10 s, fin) y vibra al terminar; guardar un entrenamiento o batir un récord también se anuncia.
- **Movimiento** (2.3.3): `prefers-reduced-motion` desactiva animaciones y transiciones.
- **Idioma** (3.1.1): `<html lang="es">` y toda la interfaz en español.

## Cómo reproducir la auditoría

1. `npm run dev` y abrir la app en Chrome/Edge.
2. Extensión [axe DevTools](https://www.deque.com/axe/devtools/) → "Scan all of my page" en cada vista y tema.
3. Lighthouse (DevTools → Lighthouse → Accessibility).
4. Prueba manual: recorrer la app solo con teclado; en Windows, lector [NVDA](https://www.nvaccess.org/) (gratuito) con Chrome o Firefox.
5. `npm test` ejecuta el chequeo de regresión con axe-core en CI.

## Limitaciones conocidas

- La prueba completa con lector de pantalla humano (NVDA/VoiceOver de principio a fin) está documentada como proceso pero debe repetirse con cada release; lo automático no la sustituye.
- El test axe de CI corre en jsdom, donde el contraste de color no es medible; por eso la verificación de contraste se hace en navegador real (tabla de arriba).
