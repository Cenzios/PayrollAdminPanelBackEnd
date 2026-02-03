export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (
  page?: string | number,
  limit?: string | number
): PaginationParams => {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page || 1;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit || 10;

  const validPage = parsedPage > 0 ? parsedPage : 1;
  const validLimit = parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10;

  return {
    page: validPage,
    limit: validLimit,
    skip: (validPage - 1) * validLimit,
  };
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};
