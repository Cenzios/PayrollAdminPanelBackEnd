export declare class AdminCompaniesService {
    getAllCompanies(page?: number, limit?: number, searchTerm?: string): Promise<{
        companies: {
            id: string;
            name: string;
            email: string;
            address: string;
            contactNumber: string;
            createdAt: Date;
            ownerName: string;
            employeeCount: number;
            subscriptionPlan: string;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
declare const _default: AdminCompaniesService;
export default _default;
//# sourceMappingURL=adminCompanies.service.d.ts.map