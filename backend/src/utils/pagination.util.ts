import { Request } from 'express';
import { PaginationMeta } from './response.util';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
