export declare class AdminRevenueService {
    getRevenueSummary(): Promise<{
        totalRevenue: number;
        onlineRevenue: number;
        manualRevenue: number;
        overdueCount: number;
        monthlyRevenue: number;
    }>;
    getAllInvoices(page: number, limit: number, filters: any): Promise<{
        invoices: ({
            user: {
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            deletedAt: Date | null;
            totalAmount: number;
            userId: string;
            subscriptionId: string;
            planId: string;
            billingType: import(".prisma/client").$Enums.BillingType;
            billingMonth: string;
            employeeCount: number;
            pricePerEmployee: number;
            registrationFee: number;
            paymentIntentId: string | null;
            paidAt: Date | null;
            billingPeriodEnd: Date | null;
            billingPeriodStart: Date | null;
            dueDate: Date | null;
            planNameSnapshot: string | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getRevenueStats(): Promise<{
        message: string;
    }>;
    getRevenueByPeriod(_startDate: Date, _endDate: Date): Promise<{
        message: string;
    }>;
}
declare const _default: AdminRevenueService;
export default _default;
//# sourceMappingURL=adminRevenue.service.d.ts.map