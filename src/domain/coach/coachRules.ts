// CAPA 2 · Dominio — Motor de reglas del coach (determinista, sin IA, sin red).
// Aplica las heurísticas de coachKnowledge a un CoachContext y emite
// recomendaciones accionables con su cita. Es el "coach básico" que SIEMPRE
// funciona: sin clave de IA, sin conexión, sin que ningún dato salga.
import type { Goal } from '../routineGenerator';
import type { CoachContext } from './coachContext';
import { citation, GOAL_PRESCRIPTION, THRESHOLDS, VOLUME_LANDMARKS } from './coachKnowledge';

export type CoachTone = 'positivo' | 'info' | 'ajuste' | 'alerta';

export interface CoachRecommendation {
  id: string;
  kind: 'fatiga' | 'sueno' | 'deload' | 'volumen' | 'frecuencia' | 'progresion' | 'objetivo' | 'datos';
  tone: CoachTone;
  titulo: string;
  detalle: string;
  /** Texto de cita ("Autor, año"), si la recomendación se apoya en evidencia. */
  fuente?: string;
}

export interface CoachVerdict {
  estado: 'descansado' | 'normal' | 'cargado' | 'sin-datos';
  titulo: string;
  detalle: string;
  fatigueScore: number;
}

const SLEEP_FMT = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** Veredicto de cabecera: cómo está el usuario hoy. */
export function fatigueVerdict(ctx: CoachContext): CoachVerdict {
  if (ctx.sessionCount === 0 || (ctx.rpeSampleSize === 0 && ctx.sleepSampleSize === 0)) {
    return {
      estado: 'sin-datos',
      titulo: 'Aún te estoy conociendo',
      detalle:
        'Registra el RPE de tus series y, si quieres, tu sueño. Con unos días de datos te daré ajustes concretos.',
      fatigueScore: ctx.fatigueScore,
    };
  }
  if (ctx.fatigueScore >= 6) {
    return {
      estado: 'cargado',
      titulo: 'Vienes cargado',
      detalle: 'Tu esfuerzo o tu descanso reciente piden bajar el pie del acelerador hoy.',
      fatigueScore: ctx.fatigueScore,
    };
  }
  if (ctx.fatigueScore <= 2.5) {
    return {
      estado: 'descansado',
      titulo: 'Estás fresco',
      detalle: 'Buen momento para apretar: tienes margen para progresar.',
      fatigueScore: ctx.fatigueScore,
    };
  }
  return {
    estado: 'normal',
    titulo: 'Listo para entrenar',
    detalle: 'Todo en orden. Mantén la pauta y registra cómo te sientan las series.',
    fatigueScore: ctx.fatigueScore,
  };
}

/**
 * Evalúa el contexto y devuelve recomendaciones ordenadas por relevancia.
 * Determinista: mismo contexto + mismo objetivo = mismas recomendaciones.
 */
export function evaluateCoach(ctx: CoachContext, goal: Goal): CoachRecommendation[] {
  const recs: CoachRecommendation[] = [];

  if (ctx.sessionCount === 0) {
    recs.push({
      id: 'datos-empezar',
      kind: 'datos',
      tone: 'info',
      titulo: 'Empieza por tu primer entrenamiento',
      detalle:
        'Genera o sigue una rutina y registra tus series. En cuanto tenga tus datos, ajustaré cargas, volumen y descansos a ti.',
    });
    recs.push(prescriptionRec(goal));
    return recs;
  }

  // 1) Fatiga por RPE alto sostenido → bajar volumen/carga hoy.
  if (ctx.hardSessionsInARow >= 2) {
    recs.push({
      id: 'fatiga-rpe',
      kind: 'fatiga',
      tone: 'alerta',
      titulo: 'Baja la intensidad hoy',
      detalle: `Llevas ${ctx.hardSessionsInARow} sesiones seguidas con RPE muy alto (≥${THRESHOLDS.rpeAltoSesion}). Quita 1 serie por ejercicio o baja ~5% la carga para recuperar.`,
      fuente: citation('robinson2024'),
    });
  }

  // 2) Ajuste por sueño bajo.
  if (ctx.avgSleepMin !== null && ctx.avgSleepMin < THRESHOLDS.suenoBajoMin) {
    recs.push({
      id: 'sueno-bajo',
      kind: 'sueno',
      tone: 'ajuste',
      titulo: 'Tu descanso está bajo',
      detalle: `Has dormido una media de ${SLEEP_FMT(ctx.avgSleepMin)}. Baja un 10-20% el volumen o la intensidad de hoy; la recuperación manda.`,
      fuente: citation('acsm2026'),
    });
  }

  // 3) Descarga (deload) por semanas continuas.
  if (ctx.weeksContinuous >= THRESHOLDS.semanasParaDeload) {
    recs.push({
      id: 'deload',
      kind: 'deload',
      tone: 'ajuste',
      titulo: 'Toca una semana de descarga',
      detalle: `Llevas ${ctx.weeksContinuous} semanas seguidas entrenando. Una semana con ~50% de series (manteniendo la técnica) te dejará rendir más después.`,
      fuente: citation('bell2023'),
    });
  }

  // 4) Progresión: ejercicios listos para subir peso.
  const ready = ctx.exerciseSignals.filter((e) => e.readyToProgress).slice(0, 3);
  for (const e of ready) {
    const inc = e.isCompound ? '~5 kg' : '~2,5 kg';
    recs.push({
      id: `progresion-${e.exerciseId}`,
      kind: 'progresion',
      tone: 'positivo',
      titulo: `Sube peso en ${e.name}`,
      detalle: `Completaste todas las series con holgura. Sube ${inc} la próxima vez (doble progresión).`,
      fuente: citation('acsm2026'),
    });
  }

  // 5) Volumen por músculo: por debajo del MEV o por encima del MRV.
  const below = ctx.muscleVolumes
    .filter((m) => m.sets > 0 && m.sets < VOLUME_LANDMARKS[m.muscle].mev)
    .slice(0, 2);
  for (const m of below) {
    recs.push({
      id: `volumen-bajo-${m.muscle}`,
      kind: 'volumen',
      tone: 'info',
      titulo: `Poco volumen en ${m.muscle}`,
      detalle: `Esta semana solo llevas ${m.sets} series de ${m.muscle} (el mínimo eficaz son ${VOLUME_LANDMARKS[m.muscle].mev}). Añade 1-2 series para estimular el crecimiento.`,
      fuente: citation('schoenfeld2017'),
    });
  }
  const above = ctx.muscleVolumes
    .filter((m) => m.sets > VOLUME_LANDMARKS[m.muscle].mrv)
    .slice(0, 1);
  for (const m of above) {
    recs.push({
      id: `volumen-alto-${m.muscle}`,
      kind: 'volumen',
      tone: 'ajuste',
      titulo: `Demasiado volumen en ${m.muscle}`,
      detalle: `${m.sets} series de ${m.muscle} supera tu máximo recuperable (~${VOLUME_LANDMARKS[m.muscle].mrv}). Recorta hacia ${VOLUME_LANDMARKS[m.muscle].mav} para recuperar mejor.`,
      fuente: citation('rpLandmarks'),
    });
  }

  // 6) Frecuencia: músculos con volumen pero entrenados una sola vez.
  const lowFreq = ctx.muscleVolumes
    .filter((m) => m.sets >= VOLUME_LANDMARKS[m.muscle].mev && m.days < THRESHOLDS.frecuenciaMin)
    .slice(0, 1);
  for (const m of lowFreq) {
    recs.push({
      id: `frecuencia-${m.muscle}`,
      kind: 'frecuencia',
      tone: 'info',
      titulo: `Reparte ${m.muscle} en 2 días`,
      detalle: `Entrenas ${m.muscle} 1 vez por semana. Repartir el mismo volumen en 2 días suele rendir más y fatiga menos cada sesión.`,
      fuente: citation('schoenfeld2017'),
    });
  }

  // 7) Pauta del objetivo (siempre, como referencia).
  recs.push(prescriptionRec(goal));

  // 8) Si no hay RPE registrado, invitar a capturarlo (mejora todo lo anterior).
  if (ctx.rpeSampleSize === 0) {
    recs.push({
      id: 'datos-rpe',
      kind: 'datos',
      tone: 'info',
      titulo: 'Registra el RPE de tus series',
      detalle:
        'El esfuerzo percibido (RPE 6-10) es la señal que uso para ajustar cargas y detectar fatiga. Es opcional, pero con él el coach afina mucho más.',
    });
  }

  return recs;
}

function prescriptionRec(goal: Goal): CoachRecommendation {
  const p = GOAL_PRESCRIPTION[goal];
  return {
    id: 'objetivo-pauta',
    kind: 'objetivo',
    tone: 'info',
    titulo: 'Tu pauta para este objetivo',
    detalle: `${p.repsMin}-${p.repsMax} reps al ${p.loadPctMin}-${p.loadPctMax}% del 1RM, RIR ${p.rir}, descanso ${p.rest}. ${p.enfoque}`,
    fuente: citation('acsm2026'),
  };
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * Consejo en lenguaje natural redactado EN LOCAL: sin IA, sin red y sin
 * descargas. Sintetiza el estado de hoy + la prioridad del momento + el
 * objetivo; no repite la lista de recomendaciones, la INTRODUCE. Determinista:
 * mismo contexto + objetivo = mismo consejo.
 */
export function composeCoachAdvice(
  ctx: CoachContext,
  verdict: CoachVerdict,
  recs: CoachRecommendation[],
  goal: Goal,
): { foco: string; mensaje: string } {
  if (verdict.estado === 'sin-datos' || ctx.sessionCount === 0) {
    return {
      foco: 'Empieza a registrar',
      mensaje:
        'Todavía no tengo datos tuyos. Registra unas sesiones con su RPE — y, si quieres, tu sueño — y cruzaré tu esfuerzo, volumen y descanso para darte ajustes concretos. Genera un plan según tu objetivo y arranca por ahí.',
    };
  }

  // La acción más relevante: alerta > ajuste > positivo > info, dejando fuera la
  // pauta de objetivo y las invitaciones a registrar datos (son de referencia).
  const RANK: Record<CoachTone, number> = { alerta: 0, ajuste: 1, positivo: 2, info: 3 };
  const top = recs
    .filter((r) => r.kind !== 'objetivo' && r.kind !== 'datos')
    .sort((a, b) => RANK[a.tone] - RANK[b.tone])[0];

  const estado: Record<CoachVerdict['estado'], string> = {
    cargado: 'Hoy vienes cargado, así que la prioridad es recuperar antes que sumar',
    descansado: 'Estás fresco y con margen: buen día para apretar un poco',
    normal: 'Estás listo para entrenar con normalidad',
    'sin-datos': '',
  };

  const objetivo: Record<Goal, string> = {
    fuerza: 'tu objetivo de fuerza pide calidad en las series pesadas más que acumular trabajo',
    hipertrofia: 'en hipertrofia, sostener el volumen semana a semana es lo que mueve la aguja',
    definicion: 'en definición, mantener la intensidad protege tu músculo mientras pierdes grasa',
  };

  const foco = top ? top.titulo : verdict.titulo;
  const punta = top
    ? ` Lo primero a atender: ${lowerFirst(top.titulo)} — lo tienes detallado justo abajo.`
    : ' Mantén la pauta y registra cómo te sientan las series.';

  return { foco, mensaje: `${estado[verdict.estado]}.${punta} Recuerda que ${objetivo[goal]}.` };
}
