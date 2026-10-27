/** Sorting / search helpers for list endpoints. */

export type SortOrder = "asc" | "desc";

/**
 * Maps `sortBy`/`sortOrder` query params to a Prisma `orderBy`, restricted to an
 * allow-list of sortable fields (prevents arbitrary-field injection).
 */
export function buildSort<T extends string>(
  sortBy: unknown,
  sortOrder: unknown,
  allowed: readonly T[],
  fallback: T,
): Record<string, SortOrder> {
  const field = (allowed as readonly string[]).includes(String(sortBy))
    ? (sortBy as T)
    : fallback;
  const order: SortOrder = sortOrder === "asc" ? "asc" : "desc";
  return { [field]: order };
}

/** Normalises a free-text search term, returning null when effectively empty. */
export function normalizeSearch(search: unknown): string | null {
  if (typeof search !== "string") return null;
  const trimmed = search.trim();
  return trimmed.length ? trimmed : null;
}
