// Utilidad de tests: base de datos limpia antes de cada test.
import { db } from '../data/db';

export async function resetDb(): Promise<void> {
  await db.delete();
  await db.open();
}
