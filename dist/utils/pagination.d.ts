export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export declare const getPaginationParams: (page?: string | number, limit?: string | number) => PaginationParams;
export declare const calculateTotalPages: (total: number, limit: number) => number;
//# sourceMappingURL=pagination.d.ts.map