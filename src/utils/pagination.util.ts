/**
 * Shared pagination helpers for list endpoints. Reads loosely-typed query values
 * (Express query params arrive as strings) and clamps them to safe bounds.
 */

export interface PaginationParams {
  page?: number | string;
  pageSize?: number | string;
  limit?: number | string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

/** Resolves `{ skip, take, page, pageSize }` for Prisma from request query. */
export function buildPagination(query: PaginationParams = {}) {
  const page = Math.max(DEFAULT_PAGE, Math.trunc(Number(query.page)) || DEFAULT_PAGE);
  const requested = Math.trunc(Number(query.pageSize ?? query.limit)) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { items, meta: buildPaginationMeta(total, page, pageSize) };
}
