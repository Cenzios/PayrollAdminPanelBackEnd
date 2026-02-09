export declare const getDashboardSummary: () => Promise<{
    activeUsers: number;
    totalCompanies: number;
    totalEmployees: number;
    monthlyRevenue: number;
    totalIncome: number;
    recentActivities: {
        id: string;
        action: string;
        userName: string;
        createdAt: Date;
        resourceType: string | null;
    }[];
    chartData: {
        month: string;
        value: number;
    }[];
}>;
//# sourceMappingURL=adminDashboard.service.d.ts.map