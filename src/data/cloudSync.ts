// CAPA 1 · Datos — Sincronización de datos por cuenta (multi-dispositivo).
//
// Las cuentas son dueñas de sus datos en Supabase (tabla genérica user_data).
// IndexedDB (Dexie) actúa como caché local rápida y offline; en cada escritura
// se empuja la fila a la nube (hooks de Dexie) y al iniciar sesión se baja todo.
// Privado por RLS: cada cuenta solo accede a lo suyo. Las sesiones de SUEÑO no
// se sincronizan aquí (llevan clips de audio Blob, no serializables a jsonb).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TempleDB } from './db';

/** Tablas de Dexie que se sincronizan, con su campo clave. */
interface SyncedTable {
  kind: string;
  table: keyof TempleDB & string;
  key: string;
}

const SYNCED: SyncedTable[] = [
  { kind: 'sessions', table: 'sessions', key: 'id' },
  { kind: 'routines', table: 'routines', key: 'id' },
  { kind: 'bodyMetrics', table: 'bodyMetrics', key: 'id' },
  { kind: 'water', table: 'water', key: 'date' },
  { kind: 'diary', table: 'diary', key: 'id' },
];

interface UserDataRow {
  user_id: string;
  kind: string;
  item_id: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface CloudSync {
  /** Instala los hooks de empuje en las tablas sincronizadas (una vez). */
  installHooks(): void;
  /** Sincroniza ahora: sube lo local que falte y baja todo lo de la nube. */
  syncNow(userId: string): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = { toArray(): Promise<any[]>; bulkPut(items: any[]): Promise<any>; hook: (...a: any[]) => any };

export function createCloudSync(sb: SupabaseClient, db: TempleDB): CloudSync {
  let pulling = false;
  let uid: string | null = null;
  let hooksInstalled = false;

  const tableOf = (name: string): AnyTable => (db as unknown as Record<string, AnyTable>)[name]!;

  async function ensureUid(): Promise<string | null> {
    if (uid) return uid;
    const { data } = await sb.auth.getUser();
    uid = data.user?.id ?? null;
    return uid;
  }

  async function pushRow(kind: string, itemId: string, data: Record<string, unknown>): Promise<void> {
    const id = await ensureUid();
    if (!id) return;
    try {
      await sb
        .from('user_data')
        .upsert(
          { user_id: id, kind, item_id: itemId, data, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,kind,item_id' },
        );
    } catch {
      // Sin red: la escritura local ya valió; se reconcilia en el próximo syncNow.
    }
  }

  async function deleteRow(kind: string, itemId: string): Promise<void> {
    const id = await ensureUid();
    if (!id) return;
    try {
      await sb.from('user_data').delete().eq('user_id', id).eq('kind', kind).eq('item_id', itemId);
    } catch {
      /* offline: se reconcilia luego */
    }
  }

  function installHooks(): void {
    if (hooksInstalled) return;
    hooksInstalled = true;
    for (const { kind, table, key } of SYNCED) {
      const t = tableOf(table);
      t.hook('creating', (_pk: unknown, obj: Record<string, unknown>) => {
        if (!pulling) void pushRow(kind, String(obj[key]), obj);
      });
      t.hook('updating', (mods: Record<string, unknown>, _pk: unknown, obj: Record<string, unknown>) => {
        if (!pulling) void pushRow(kind, String(obj[key]), { ...obj, ...mods });
      });
      t.hook('deleting', (pk: unknown, obj: Record<string, unknown>) => {
        if (!pulling) void deleteRow(kind, String((obj && obj[key]) ?? pk));
      });
    }
  }

  async function pushAllLocal(): Promise<void> {
    const id = await ensureUid();
    if (!id) return;
    const now = new Date().toISOString();
    for (const { kind, table, key } of SYNCED) {
      const rows = await tableOf(table).toArray();
      if (rows.length === 0) continue;
      const payload: UserDataRow[] = rows.map((row) => ({
        user_id: id,
        kind,
        item_id: String((row as Record<string, unknown>)[key]),
        data: row as Record<string, unknown>,
        updated_at: now,
      }));
      try {
        await sb.from('user_data').upsert(payload, { onConflict: 'user_id,kind,item_id' });
      } catch {
        /* offline */
      }
    }
  }

  async function pull(): Promise<void> {
    const id = await ensureUid();
    if (!id) return;
    const { data, error } = await sb
      .from('user_data')
      .select('kind, item_id, data')
      .eq('user_id', id);
    if (error || !data) return;
    const rows = data as { kind: string; data: Record<string, unknown> }[];
    pulling = true;
    try {
      for (const { kind, table } of SYNCED) {
        const items = rows.filter((r) => r.kind === kind).map((r) => r.data);
        if (items.length) await tableOf(table).bulkPut(items);
      }
    } finally {
      pulling = false;
    }
  }

  async function syncNow(userId: string): Promise<void> {
    uid = userId;
    // La primera vez en este dispositivo, sube lo local (que no se pierda al
    // pasar a la nube). Después basta con bajar; los cambios se empujan por hook.
    const migratedKey = `forjafit-synced-${userId}`;
    if (!localStorage.getItem(migratedKey)) {
      await pushAllLocal();
      localStorage.setItem(migratedKey, '1');
    }
    await pull();
  }

  return { installHooks, syncNow };
}

import { db } from './db';
import { isSupabaseEnabled, supabase } from './supabase';

// Singleton: activo solo en la nube. Los hooks de empuje se instalan al cargar.
export const cloudSync: CloudSync | null =
  isSupabaseEnabled && supabase ? createCloudSync(supabase, db) : null;
cloudSync?.installHooks();
