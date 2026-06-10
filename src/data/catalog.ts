// CAPA 1 · Datos — Catálogo base de ejercicios.
//
// Catálogo PROPIO, redactado en español desde cero para este proyecto.
// Decisión documentada en docs/INFORME_TECNICO.md (sección 4): los datasets
// "gratuitos" habituales tienen imágenes e instrucciones con procedencia
// legal dudosa (DMCA verificado en abril de 2026), así que ForjaFit no
// depende de datos de terceros. Los nombres de ejercicios son hechos de
// conocimiento común; las instrucciones son texto original de este proyecto.
import type { Equipment, Exercise, MuscleGroup } from './models';

export type CatalogExercise = Omit<Exercise, 'isCustom' | 'createdAt'>;

function ex(
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  instructions: string,
): CatalogExercise {
  return { id, name, muscleGroup, equipment, instructions };
}

export const CATALOG: readonly CatalogExercise[] = [
  // ─── Pecho ────────────────────────────────────────────────────────────
  ex(
    'press-banca',
    'Press de banca',
    'pecho',
    'barra',
    'Tumbado en el banco, baja la barra con control hasta rozar el pecho y empújala hacia arriba sin bloquear bruscamente los codos. Mantén los pies firmes en el suelo y las escápulas retraídas.',
  ),
  ex(
    'press-banca-inclinado',
    'Press de banca inclinado',
    'pecho',
    'barra',
    'En banco inclinado a 30-45°, baja la barra hacia la parte alta del pecho y empuja en línea recta. Trabaja más la porción superior del pectoral.',
  ),
  ex(
    'press-mancuernas',
    'Press con mancuernas',
    'pecho',
    'mancuernas',
    'Tumbado, empuja las mancuernas desde la altura del pecho hasta extender los brazos, dejando que desciendan algo más abajo que una barra. Controla la bajada.',
  ),
  ex(
    'aperturas-mancuernas',
    'Aperturas con mancuernas',
    'pecho',
    'mancuernas',
    'Tumbado y con los codos ligeramente flexionados, abre los brazos en arco hasta sentir el estiramiento del pectoral y vuelve a juntar las mancuernas arriba.',
  ),
  ex(
    'flexiones',
    'Flexiones',
    'pecho',
    'peso corporal',
    'Con el cuerpo recto como una tabla y las manos algo más abiertas que los hombros, baja el pecho hasta casi tocar el suelo y empuja. No dejes caer la cadera.',
  ),
  ex(
    'cruce-poleas',
    'Cruce de poleas',
    'pecho',
    'polea',
    'De pie entre dos poleas altas, lleva las manos al frente y abajo en arco, juntándolas frente a la cadera. Aprieta el pectoral al cerrar.',
  ),
  ex(
    'press-pecho-maquina',
    'Press de pecho en máquina',
    'pecho',
    'máquina',
    'Ajusta el asiento para que las empuñaduras queden a la altura del pecho. Empuja hasta extender los brazos y vuelve con control. Útil para aprender el patrón con seguridad.',
  ),

  // ─── Espalda ──────────────────────────────────────────────────────────
  ex(
    'dominadas',
    'Dominadas',
    'espalda',
    'peso corporal',
    'Colgado de la barra con agarre prono, tira hasta pasar la barbilla por encima de la barra y baja con control hasta estirar los brazos. Evita balancearte.',
  ),
  ex(
    'jalon-al-pecho',
    'Jalón al pecho',
    'espalda',
    'polea',
    'Sentado, tira de la barra hacia la parte alta del pecho llevando los codos abajo y atrás. Mantén el torso casi vertical, sin impulsos.',
  ),
  ex(
    'remo-barra',
    'Remo con barra',
    'espalda',
    'barra',
    'Con el torso inclinado y la espalda neutra, tira de la barra hacia el abdomen llevando los codos pegados al cuerpo. Baja con control sin redondear la zona lumbar.',
  ),
  ex(
    'remo-mancuerna',
    'Remo con mancuerna a una mano',
    'espalda',
    'mancuernas',
    'Apoya rodilla y mano en un banco, espalda recta. Tira de la mancuerna hacia la cadera y baja con control. Trabaja cada lado por separado.',
  ),
  ex(
    'remo-polea-baja',
    'Remo en polea baja',
    'espalda',
    'polea',
    'Sentado con las rodillas semiflexionadas, tira del agarre hacia el abdomen manteniendo el pecho alto. Junta las escápulas al final del recorrido.',
  ),
  ex(
    'pullover-mancuerna',
    'Pullover con mancuerna',
    'espalda',
    'mancuernas',
    'Tumbado transversal al banco, sujeta una mancuerna sobre el pecho y bájala por detrás de la cabeza con los codos casi rectos. Vuelve apretando dorsal y pecho.',
  ),
  ex(
    'encogimientos',
    'Encogimientos de hombros',
    'espalda',
    'mancuernas',
    'De pie con una mancuerna en cada mano, eleva los hombros hacia las orejas y baja despacio. Trabaja el trapecio; no gires los hombros en círculo.',
  ),

  // ─── Hombros ──────────────────────────────────────────────────────────
  ex(
    'press-militar',
    'Press militar',
    'hombros',
    'barra',
    'De pie, empuja la barra desde la clavícula hasta extender los brazos sobre la cabeza, metiendo ligeramente la cabeza al pasar la barra. Glúteo y core firmes.',
  ),
  ex(
    'press-hombro-mancuernas',
    'Press de hombro con mancuernas',
    'hombros',
    'mancuernas',
    'Sentado o de pie, empuja las mancuernas desde la altura de las orejas hasta arriba sin chocarlas. Baja con control hasta los 90 grados.',
  ),
  ex(
    'elevaciones-laterales',
    'Elevaciones laterales',
    'hombros',
    'mancuernas',
    'Con los codos ligeramente flexionados, eleva las mancuernas a los lados hasta la altura de los hombros y baja despacio. Peso moderado: la técnica manda.',
  ),
  ex(
    'elevaciones-frontales',
    'Elevaciones frontales',
    'hombros',
    'mancuernas',
    'Eleva las mancuernas al frente hasta la altura de los hombros, alternando o a la vez, sin balancear el torso.',
  ),
  ex(
    'pajaros',
    'Pájaros (deltoides posterior)',
    'hombros',
    'mancuernas',
    'Con el torso inclinado y la espalda neutra, abre los brazos a los lados como un péndulo invertido. Trabaja la parte posterior del hombro, clave para la postura.',
  ),
  ex(
    'face-pull',
    'Face pull',
    'hombros',
    'polea',
    'Con cuerda en polea alta, tira hacia la cara separando los extremos a la altura de las orejas, rotando los hombros hacia fuera. Excelente para hombro sano.',
  ),

  // ─── Bíceps ───────────────────────────────────────────────────────────
  ex(
    'curl-barra',
    'Curl de bíceps con barra',
    'bíceps',
    'barra',
    'De pie, codos pegados al torso, sube la barra contrayendo el bíceps y baja despacio hasta estirar el brazo. Sin balanceo lumbar.',
  ),
  ex(
    'curl-mancuernas',
    'Curl con mancuernas',
    'bíceps',
    'mancuernas',
    'Sube las mancuernas girando las muñecas (supinación) hasta arriba y baja con control. Puede hacerse alternando brazos.',
  ),
  ex(
    'curl-martillo',
    'Curl martillo',
    'bíceps',
    'mancuernas',
    'Igual que el curl, pero con las palmas enfrentadas durante todo el recorrido. Implica más el braquial y el antebrazo.',
  ),
  ex(
    'curl-polea',
    'Curl en polea baja',
    'bíceps',
    'polea',
    'Con barra o cuerda en polea baja, flexiona los codos manteniéndolos fijos al costado. La polea mantiene tensión continua en todo el recorrido.',
  ),
  ex(
    'curl-scott',
    'Curl en banco Scott',
    'bíceps',
    'máquina',
    'Con los brazos apoyados en el pupitre, sube el peso sin despegar los codos y baja hasta casi estirar. Aísla el bíceps y evita trampas.',
  ),

  // ─── Tríceps ──────────────────────────────────────────────────────────
  ex(
    'press-frances',
    'Press francés',
    'tríceps',
    'barra',
    'Tumbado, baja la barra Z hacia la frente flexionando solo los codos y extiende de vuelta. Codos apuntando al techo, sin abrirlos.',
  ),
  ex(
    'extension-triceps-polea',
    'Extensión de tríceps en polea',
    'tríceps',
    'polea',
    'De pie frente a la polea alta, extiende los codos hacia abajo manteniéndolos pegados al cuerpo y vuelve con control hasta los 90 grados.',
  ),
  ex(
    'fondos-paralelas',
    'Fondos en paralelas',
    'tríceps',
    'peso corporal',
    'Sujeto en las paralelas, baja flexionando los codos hasta unos 90° y empuja hasta estirar. Torso vertical para tríceps, inclinado para pecho.',
  ),
  ex(
    'patada-triceps',
    'Patada de tríceps',
    'tríceps',
    'mancuernas',
    'Con el torso inclinado y el codo alto y fijo, extiende el brazo hacia atrás hasta estirarlo y vuelve despacio.',
  ),
  ex(
    'press-cerrado',
    'Press de banca con agarre cerrado',
    'tríceps',
    'barra',
    'Como el press de banca pero con las manos a la anchura de los hombros y los codos pegados. El tríceps hace el trabajo principal.',
  ),

  // ─── Pierna ───────────────────────────────────────────────────────────
  ex(
    'sentadilla',
    'Sentadilla con barra',
    'pierna',
    'barra',
    'Con la barra sobre los trapecios, baja como si te sentaras manteniendo el pecho alto y las rodillas alineadas con los pies, y sube empujando el suelo. El rey de los ejercicios de pierna.',
  ),
  ex(
    'sentadilla-frontal',
    'Sentadilla frontal',
    'pierna',
    'barra',
    'Con la barra apoyada en los deltoides frontales y los codos altos, baja manteniendo el torso lo más vertical posible. Más énfasis en el cuádriceps.',
  ),
  ex(
    'sentadilla-goblet',
    'Sentadilla goblet',
    'pierna',
    'kettlebell',
    'Sujeta la pesa rusa contra el pecho y baja en sentadilla profunda con los codos por dentro de las rodillas. Ideal para aprender el patrón.',
  ),
  ex(
    'prensa-piernas',
    'Prensa de piernas',
    'pierna',
    'máquina',
    'Empuja la plataforma hasta casi estirar las rodillas (sin bloquearlas) y baja con control hasta unos 90°. No despegues la zona lumbar del respaldo.',
  ),
  ex(
    'zancadas',
    'Zancadas',
    'pierna',
    'mancuernas',
    'Da un paso largo al frente y baja hasta que ambas rodillas formen 90°, sin que la rodilla delantera pase mucho la punta del pie. Alterna piernas.',
  ),
  ex(
    'extension-cuadriceps',
    'Extensión de cuádriceps',
    'pierna',
    'máquina',
    'Sentado en la máquina, extiende las rodillas hasta arriba con una pausa breve y baja despacio. Aísla el cuádriceps.',
  ),
  ex(
    'curl-femoral',
    'Curl femoral',
    'pierna',
    'máquina',
    'Flexiona las rodillas llevando el rodillo hacia el glúteo y vuelve con control. Aísla los isquiotibiales; clave para el equilibrio de la pierna.',
  ),
  ex(
    'peso-muerto-rumano',
    'Peso muerto rumano',
    'pierna',
    'barra',
    'Con las rodillas semiflexionadas, baja la barra pegada a las piernas empujando la cadera atrás hasta sentir el estiramiento de los isquios, y sube apretando el glúteo.',
  ),
  ex(
    'elevacion-gemelos',
    'Elevación de gemelos',
    'pierna',
    'máquina',
    'Sube sobre las puntas de los pies con pausa arriba y baja lento hasta estirar el gemelo por debajo del escalón. Recorrido completo.',
  ),

  // ─── Glúteo ───────────────────────────────────────────────────────────
  ex(
    'hip-thrust',
    'Hip thrust',
    'glúteo',
    'barra',
    'Con la espalda alta apoyada en un banco y la barra sobre la cadera, empuja con los talones hasta alinear rodillas, cadera y hombros. Aprieta el glúteo arriba un segundo.',
  ),
  ex(
    'puente-gluteo',
    'Puente de glúteo',
    'glúteo',
    'peso corporal',
    'Tumbado con las rodillas flexionadas, eleva la cadera apretando el glúteo y baja sin tocar del todo el suelo. Versión sin material del hip thrust.',
  ),
  ex(
    'patada-gluteo-polea',
    'Patada de glúteo en polea',
    'glúteo',
    'polea',
    'Con la tobillera en la polea baja, lleva la pierna atrás y arriba sin arquear la lumbar, y vuelve con control.',
  ),

  // ─── Core ─────────────────────────────────────────────────────────────
  ex(
    'plancha',
    'Plancha',
    'core',
    'peso corporal',
    'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto apretando abdomen y glúteo. Registra los segundos en el campo de repeticiones.',
  ),
  ex(
    'plancha-lateral',
    'Plancha lateral',
    'core',
    'peso corporal',
    'De lado, apoyado en un antebrazo, mantén la cadera alta y el cuerpo alineado. Trabaja el oblicuo; registra los segundos como repeticiones.',
  ),
  ex(
    'crunch',
    'Crunch abdominal',
    'core',
    'peso corporal',
    'Tumbado con las rodillas flexionadas, despega las escápulas del suelo contrayendo el abdomen y baja despacio. No tires del cuello.',
  ),
  ex(
    'elevaciones-piernas',
    'Elevaciones de piernas',
    'core',
    'peso corporal',
    'Tumbado o colgado, eleva las piernas hasta 90° controlando la bajada sin arquear la zona lumbar.',
  ),
  ex(
    'rueda-abdominal',
    'Rueda abdominal',
    'core',
    'otro',
    'De rodillas, rueda hacia delante manteniendo el abdomen apretado y vuelve sin arquear la lumbar. Avanza el recorrido de forma progresiva.',
  ),
  ex(
    'giro-ruso',
    'Giro ruso',
    'core',
    'otro',
    'Sentado con el torso inclinado atrás y los pies elevados, gira el tronco de lado a lado con o sin peso. Movimiento controlado, sin rebotes.',
  ),

  // ─── Cuerpo completo ──────────────────────────────────────────────────
  ex(
    'peso-muerto',
    'Peso muerto',
    'cuerpo completo',
    'barra',
    'Con la barra sobre el medio del pie, agarra con la espalda neutra y levanta empujando el suelo hasta quedar erguido. El levantamiento más completo: pierna, glúteo, espalda y agarre.',
  ),
  ex(
    'kettlebell-swing',
    'Swing con kettlebell',
    'cuerpo completo',
    'kettlebell',
    'Balancea la pesa rusa entre las piernas y proyecta la cadera al frente para llevarla a la altura del pecho. El impulso nace de la cadera, no de los brazos.',
  ),
  ex(
    'burpees',
    'Burpees',
    'cuerpo completo',
    'peso corporal',
    'Desde de pie: apoya las manos, lleva los pies atrás a plancha, haz una flexión, recoge los pies y salta. Acondicionamiento global.',
  ),
  ex(
    'remo-renegado',
    'Remo renegado',
    'cuerpo completo',
    'mancuernas',
    'En posición de plancha sobre dos mancuernas, rema con un brazo manteniendo la cadera estable y alterna. Core y espalda a la vez.',
  ),
];
