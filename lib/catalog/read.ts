// Keep database failures distinct from valid empty results.
export function assertRead(
  error: { message: string } | null,
  context: string,
): asserts error is null {
  if (error) {
    console.error(`Could not load ${context}:`, error.message);
    throw new Error(`The ${context} could not be loaded. Please try again.`);
  }
}
export async function readAll<T>(
  read: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
  context: string,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await read(from, from + 999);
    assertRead(result.error, context);
    const batch = (result.data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}
