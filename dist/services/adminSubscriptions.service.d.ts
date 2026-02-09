export declare class AdminSubscriptionsService {
    getSubscriptionTimeline(userId: string): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            description: string;
            registrationFee: number;
            price: number;
            employeePrice: number;
            maxEmployees: number;
            maxCompanies: number;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        userId: string;
        planId: string;
        selectedAt: Date | null;
        activatedAt: Date | null;
        startDate: Date;
        endDate: Date;
    })[]>;
    getAllSubscriptions(_page: number, _limit: number): Promise<{
        message: string;
    }>;
    getSubscriptionStats(): Promise<{
        message: string;
    }>;
}
declare const _default: AdminSubscriptionsService;
export default _default;
//# sourceMappingURL=adminSubscriptions.service.d.ts.map