import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../test/dbTestUtils';
import { diaryToCsv, exportBundle, importBundle, sessionsToCsv } from './exportImport';
import type { DiaryEntry } from './nutritionModels';
import type { Exercise, Session } from './models';
import { addRoutine } from './repositories/routineRepo';
import { addSession } from './repositories/sessionRepo';
import { ensureSeeded } from './seed';

describe('exportImport', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('exporta e importa un paquete completo (viaje de ida y vuelta)', async () => {
    await ensureSeeded();
    await addRoutine({ name: 'Full body', exerciseIds: ['sentadilla', 'press-banca'] });
    await addSession({
      date: '2026-06-09T18:00:00.000Z',
      entries: [{ exerciseId: 'sentadilla', sets: [{ reps: 5, weightKg: 80, done: true }] }],
    });

    const bundle = await exportBundle();
    expect(bundle.schema).toBe('forjafit');
    expect(bundle.version).toBe(3);
    expect(bundle.exercises.length).toBeGreaterThanOrEqual(50);
    expect(bundle.routines).toHaveLength(1);
    expect(bundle.sessions).toHaveLength(1);

    // Base de datos nueva (otro dispositivo): la importación restaura todo.
    await resetDb();
    const result = await importBundle(JSON.stringify(bundle));
    expect(result.exercises).toBe(bundle.exercises.length);
    expect(result.routines).toBe(1);
    expect(result.sessions).toBe(1);
  });

  it('la importación es una fusión: no duplica lo ya existente', async () => {
    await ensureSeeded();
    const bundle = await exportBundle();
    const result = await importBundle(bundle);
    expect(result.exercises).toBe(0);
  });

  it('rechaza archivos que no son exportaciones de Temple', async () => {
    await expect(importBundle('esto no es json')).rejects.toThrow(/JSON válido/);
    await expect(importBundle({ otra: 'cosa' })).rejects.toThrow(/no es una exportación/);
    await expect(
      importBundle({ schema: 'forjafit', version: 99, exercises: [], routines: [], sessions: [] }),
    ).rejects.toThrow(/Versión de exportación no soportada/);
  });

  it('sigue importando copias antiguas v1 (sin nutrición ni comunidad)', async () => {
    const v1 = {
      schema: 'forjafit',
      version: 1,
      exportedAt: '2026-06-01T00:00:00.000Z',
      exercises: [],
      routines: [],
      sessions: [
        {
          id: 'legacy-1',
          date: '2026-05-01T10:00:00.000Z',
          entries: [{ exerciseId: 'sentadilla', sets: [{ reps: 5, weightKg: 80, done: true }] }],
        },
      ],
    };
    const result = await importBundle(v1);
    expect(result.sessions).toBe(1);
    expect(result.foods).toBe(0);
  });

  it('genera CSV con una fila por serie y campos escapados', () => {
    const exercises: Exercise[] = [
      {
        id: 'x1',
        name: 'Press "pesado", inclinado',
        muscleGroup: 'pecho',
        equipment: 'barra',
        instructions: '',
        isCustom: true,
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const sessions: Session[] = [
      {
        id: 's1',
        date: '2026-06-09T18:00:00.000Z',
        entries: [
          {
            exerciseId: 'x1',
            sets: [
              { reps: 8, weightKg: 60, done: true },
              { reps: 6, weightKg: 65, done: false },
            ],
          },
        ],
      },
    ];

    const csv = sessionsToCsv(sessions, exercises);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('fecha,ejercicio,serie,repeticiones,peso_kg,completada');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"Press ""pesado"", inclinado"');
    expect(lines[1]).toContain('8,60,sí');
    expect(lines[2]).toContain('6,65,no');
  });

  it('exporta el diario de nutrición a CSV ordenado por fecha y comida', () => {
    const diary: DiaryEntry[] = [
      {
        id: 'd2',
        date: '2026-06-16',
        meal: 'comida',
        foodName: 'Arroz',
        grams: 200,
        kcal: 260,
        proteinG: 5,
        carbsG: 56,
        fatG: 1,
      },
      {
        id: 'd1',
        date: '2026-06-15',
        meal: 'desayuno',
        foodName: 'Avena',
        grams: 80,
        kcal: 300,
        proteinG: 10,
        carbsG: 50,
        fatG: 6,
      },
    ];

    const csv = diaryToCsv(diary);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('fecha,comida,alimento,gramos,kcal,proteina_g,carbohidratos_g,grasa_g');
    expect(lines).toHaveLength(3);
    // Ordenado por fecha ascendente: 15 antes que 16.
    expect(lines[1]).toContain('2026-06-15');
    expect(lines[1]).toContain('Avena');
    expect(lines[1]).toContain('Desayuno');
    expect(lines[2]).toContain('2026-06-16');
  });
});
