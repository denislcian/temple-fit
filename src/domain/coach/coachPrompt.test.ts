import { describe, expect, it } from 'vitest';
import { payloadHash, validateAdvice, type AdvicePayload } from './coachPrompt';

const PAYLOAD: AdvicePayload = {
  veredicto: { estado: 'cargado', titulo: 'Vienes cargado', fatiga: 6.5 },
  contexto: { sesionesPorSemana: 3.5, rpeMedio7d: 9.2, suenoMedioHoras: 6.5, semanasSinDescarga: 7 },
  objetivo: 'hipertrofia',
  pauta: { reps: '6-15', cargaPct: '67-85% 1RM', rir: '0-2', descanso: '60-90 s' },
  recomendaciones: [
    {
      titulo: 'Baja la intensidad hoy',
      detalle: 'Llevas 2 sesiones seguidas con RPE muy alto (≥9). Quita 1 serie por ejercicio.',
      fuente: 'Robinson et al. (proximidad al fallo / RIR), 2024',
    },
  ],
};

const ok = (foco: string, mensaje: string) => JSON.stringify({ foco, mensaje });

describe('validateAdvice: acepta lo seguro', () => {
  it('acepta un consejo con números y citas presentes en la entrada', () => {
    const out = validateAdvice(
      ok('Recupera hoy', 'Vienes cargado (fatiga 6.5). Quita 1 serie por ejercicio y mantén RIR 0-2. Robinson et al., 2024 respalda frenar con RPE 9 sostenido.'),
      PAYLOAD,
    );
    expect(out).not.toBeNull();
    expect(out!.foco).toBe('Recupera hoy');
  });

  it('tolera vallas de código ```json', () => {
    const raw = '```json\n' + ok('Foco', 'Duerme 6.5 horas de media: prioriza descanso.') + '\n```';
    expect(validateAdvice(raw, PAYLOAD)).not.toBeNull();
  });
});

describe('validateAdvice: rechaza alucinaciones', () => {
  it('rechaza números que no están en la entrada', () => {
    expect(validateAdvice(ok('Foco', 'Sube 12,5 kg la próxima semana.'), PAYLOAD)).toBeNull();
  });

  it('rechaza autores inventados', () => {
    expect(
      validateAdvice(ok('Foco', 'Como demuestra Martínez et al., baja 1 serie.'), PAYLOAD),
    ).toBeNull();
  });

  it('acepta autores que SÍ vienen en las fuentes', () => {
    expect(
      validateAdvice(ok('Foco', 'Robinson et al. respalda quitar 1 serie hoy.'), PAYLOAD),
    ).not.toBeNull();
  });

  it('rechaza URLs', () => {
    expect(validateAdvice(ok('Foco', 'Lee más en https://ejemplo.com'), PAYLOAD)).toBeNull();
  });

  it('rechaza JSON malformado, campos vacíos y tamaños excesivos', () => {
    expect(validateAdvice('no es json', PAYLOAD)).toBeNull();
    expect(validateAdvice(ok('', 'Mensaje 1'), PAYLOAD)).toBeNull();
    expect(validateAdvice(ok('Foco', 'x'.repeat(601)), PAYLOAD)).toBeNull();
    expect(validateAdvice(JSON.stringify({ foco: 'F' }), PAYLOAD)).toBeNull();
  });
});

describe('validateAdvice: modo pregunta (habla con tu coach)', () => {
  const QP: AdvicePayload = {
    ...PAYLOAD,
    pregunta: '¿Puedo entrenar 6 días a la semana?',
    conocimiento: [
      {
        regla: 'Para fuerza en entrenados, descansa >2 min entre series.',
        fuente: 'Grgic et al. (descansos entre series, revisión sistemática), 2018',
      },
    ],
  };

  it('los números de la propia pregunta están permitidos en la respuesta', () => {
    expect(
      validateAdvice(ok('Frecuencia', 'Entrenar 6 días es viable si el volumen se reparte.'), QP),
    ).not.toBeNull();
  });

  it('acepta autores que vienen de la base de conocimiento', () => {
    expect(
      validateAdvice(ok('Descansos', 'Descansa 2 min o más; lo respalda Grgic et al., 2018.'), QP),
    ).not.toBeNull();
  });

  it('sigue rechazando autores ajenos aunque haya conocimiento', () => {
    expect(validateAdvice(ok('X', 'Lo dice Fernández et al. claramente.'), QP)).toBeNull();
  });
});

describe('payloadHash', () => {
  it('mismo payload → mismo hash; payload distinto → hash distinto', () => {
    const a = payloadHash(PAYLOAD);
    expect(payloadHash({ ...PAYLOAD })).toBe(a);
    expect(payloadHash({ ...PAYLOAD, objetivo: 'fuerza' })).not.toBe(a);
  });
});
