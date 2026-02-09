export declare class AdminRevenueService {
    getRevenueSummary(): Promise<{
        totalRevenue: number;
        monthlyRevenue: number;
        arpu: number;
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
            deletedAt: Date | null;
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