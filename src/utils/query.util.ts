import { PaginationQuery } from "../schemas/request/request.dto.js";

export function parseQuery(query: PaginationQuery) {

    return {
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        search: query.search,
        orderBy: {
            [query.sortBy]: query.sortOrder,
        } as Record<string, "asc" | "desc">,
    };
}