import { beforeEach, describe, expect, it } from 'vitest';
import { createCloudSync } from './cloudSync';
import { db } from './db';

/** Mock mínimo de Supabase: una tabla user_data en memoria, API encadenable. */
function makeMockSb() {
  const store = new Map<string, Record<string, unknown>>();
  const k = (u: unknown, kind: unknown, id: unknown) => `${u}|${kind}|${id}`;
  const sb = {
    store,
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from() {
      return {
        upsert(rows: Record<string, unknown> | Record<string, unknown>[]) {
          for (const r of Array.isArray(rows) ? rows : [rows]) {
            store.set(k(r.user_id, r.kind, r.item_id), r);
          }
          return Promise.resolve({ data: null, error: null });
        },
        select() {
          const filters: Record<string, unknown> = {};
          const builder = {
            eq(col: string, val: unknown) {
              filters[col] = val;
              return builder;
            },
            then(resolve: (r: { data: unknown[]; error: null }) => void) {
              const rows = [...store.values()].filter((r) =>
                Object.entries(filters).every(([c, v]) => r[c] === v),
              );
              resolve({ data: rows, error: null });
            },
          };
          return builder;
        },
        delete() {
          const filters: Record<string, unknown> = {};
          const builder = {
            eq(col: string, val: unknown) {
              filters[col] = val;
              return builder;
            },
            then(resolve: (r: { data: null; error: null }) => void) {
              for (const [key, r] of store) {
                if (Object.entries(filters).every(([c, v]) => r[c] === v)) store.delete(key);
              }
              resolve({ data: null, error: null });
            },
          };
          return builder;
        },
      };
    },
  };
  return sb;
}

async function clearSynced() {
  await Promise.all([
    db.sessions.clear(),
    db.routines.clear(),
    db.bodyMetrics.clear(),
    db.water.clear(),
    db.diary.clear(),
  ]);
}

const session = (id: string) => ({
  id,
  date: '2026-06-25T10:00:00.000Z',
  entries: [{ exerciseId: 'press-banca', sets: [{ reps: 5, weightKg: 60, done: true }] }],
});

describe('cloudSync', () => {
  beforeEach(async () => {
    localStorage.removeItem('forjafit-synced-u1');
    await clearSynced();
  });

  it('sube los datos locales a la nube (pushAllLocal)', async () => {
    const sb = makeMockSb();
    const sync = createCloudSync(sb as never, db);
    await db.sessions.add(session('s1'));
    await db.routines.add({ id: 'r1', name: 'Pierna', exerciseIds: ['sentadilla'], createdAt: '2026-06-25' });
    await sync.syncNow('u1');
    const kinds = [...sb.store.values()].map((r) => `${r.kind}:${r.item_id}`);
    expect(kinds).toContain('sessions:s1');
    expect(kinds).toContain('routines:r1');
  });

  it('en un dispositivo nuevo, baja todo de la nube (pull)', async () => {
    const sb = makeMockSb();
    const sync = createCloudSync(sb as never, db);
    await db.sessions.add(session('s1'));
    await sync.syncNow('u1'); // sube s1
    await clearSynced(); // simula otro dispositivo, sin datos locales
    expect(await db.sessions.get('s1')).toBeUndefined();
    await sync.syncNow('u1'); // baja s1
    expect(await db.sessions.get('s1')).toBeDefined();
  });

  it('une lo local con lo de la nube sin perder ninguno', async () => {
    const sb = makeMockSb();
    // La nube ya tiene s-cloud (de otro dispositivo).
    sb.store.set('u1|sessions|s-cloud', {
      user_id: 'u1',
      kind: 'sessions',
      item_id: 's-cloud',
      data: session('s-cloud'),
    });
    const sync = createCloudSync(sb as never, db);
    await db.sessions.add(session('s-local'));
    await sync.syncNow('u1');
    expect(await db.sessions.get('s-local')).toBeDefined();
    expect(await db.sessions.get('s-cloud')).toBeDefined();
  });
});
