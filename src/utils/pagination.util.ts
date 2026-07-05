import { HttpError } from "./http-error";

export interface LeadListQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  serviceType?: string;
  email?: string;
  phone?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
  cursor?: string;
}

export function parsePagination(query: LeadListQuery): ParsedPagination {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);

  if (query.cursor) {
    const cursorDate = new Date(query.cursor);
    if (Number.isNaN(cursorDate.getTime())) {
      throw new HttpError(400, "Invalid cursor date");
    }
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    cursor: query.cursor
  };
}

export function buildNextCursor(createdDate?: string): string | null {
  return createdDate ?? null;
}
