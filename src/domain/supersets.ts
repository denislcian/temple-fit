// CAPA 2 · Dominio — Superseries (estilo Hevy: agrupación nativa).
// Los ejercicios de una sesión que comparten `supersetGroup` forman una
// superserie. Funciones puras sobre cualquier lista con ese campo (vale para
// el borrador de TrainView y para las sesiones guardadas).

export interface SupersetMember {
  supersetGroup?: number;
}

/** Quita el grupo a los miembros huérfanos (grupos con menos de 2 ejercicios). */
export function cleanupSupersets<T extends SupersetMember>(entries: T[]): T[] {
  const count = new Map<number, number>();
  for (const e of entries) {
    if (e.supersetGroup !== undefined) {
      count.set(e.supersetGroup, (count.get(e.supersetGroup) ?? 0) + 1);
    }
  }
  return entries.map((e) => {
    if (e.supersetGroup !== undefined && (count.get(e.supersetGroup) ?? 0) < 2) {
      const rest = { ...e };
      delete rest.supersetGroup;
      return rest;
    }
    return e;
  });
}

/**
 * Enlaza (o desenlaza) el ejercicio `index` en superserie con el anterior.
 * - Si ya comparten grupo → lo desenlaza (y disuelve grupos huérfanos).
 * - Si no → lo une al grupo del anterior (creándolo si el anterior iba suelto).
 * Devuelve una lista nueva; con `index` fuera de rango devuelve la original.
 */
export function toggleSupersetWithPrevious<T extends SupersetMember>(
  entries: T[],
  index: number,
): T[] {
  if (index <= 0 || index >= entries.length) return entries;
  const prev = entries[index - 1]!;
  const cur = entries[index]!;

  const linked = cur.supersetGroup !== undefined && cur.supersetGroup === prev.supersetGroup;
  if (linked) {
    const next = entries.map((e, i) => {
      if (i !== index) return e;
      const rest = { ...e };
      delete rest.supersetGroup;
      return rest;
    });
    return cleanupSupersets(next);
  }

  const group =
    prev.supersetGroup ??
    Math.max(0, ...entries.map((e) => e.supersetGroup ?? 0)) + 1;
  const next = entries.map((e, i) => {
    if (i === index - 1 || i === index) return { ...e, supersetGroup: group };
    return e;
  });
  return cleanupSupersets(next);
}

/**
 * Letra de superserie por ejercicio ('A', 'B', …) según el orden de aparición
 * de cada grupo, o null si va suelto. Para pintar el chip "Superserie A".
 */
export function supersetLetters(entries: readonly SupersetMember[]): Array<string | null> {
  const letterByGroup = new Map<number, string>();
  return entries.map((e) => {
    if (e.supersetGroup === undefined) return null;
    let letter = letterByGroup.get(e.supersetGroup);
    if (!letter) {
      letter = String.fromCharCode(65 + letterByGroup.size); // A, B, C…
      letterByGroup.set(e.supersetGroup, letter);
    }
    return letter;
  });
}
