// CAPA 1 · Datos — Cliente Supabase (nube). Si no hay credenciales, queda en
// null y la app usa el modo local. La anon key es pública; la autorización la
// impone Row Level Security en Postgres.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const isSupabaseEnabled = supabase !== null;
