import BRANCH_REPO from "../../../database/branch/index.repo.js";
import { buildPagination, paginate } from "../../../utils/pagination.util.js";
import { buildSort, normalizeSearch } from "../../../utils/query.util.js";
import { ListBranchesQuery } from "../../../schemas/branch/listBranches.schema.js";

const SORTABLE = ["name", "code", "createdAt"] as const;

export default async function listBranches(
  companyId: string,
  query: ListBranchesQuery,
) {
  const { skip, take, page, pageSize } = buildPagination(query);
  const orderBy = buildSort(query.sortBy, query.sortOrder, SORTABLE, "name");

  const { items, total } = await BRANCH_REPO.listBranches({
    companyId,
    search: normalizeSearch(query.search),
    includeInactive: String(query.includeInactive) === "true",
    orderBy,
    skip,
    take,
  });

  return paginate(items, total, page, pageSize);
}
