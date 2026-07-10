export declare class AdminPlansService {
    getAllPlans(): Promise<({
        features: {
            id: string;
            createdAt: Date;
            planId: string;
            featureName: string;
            isEnabled: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        registrationFee: number;
        price: number;
        employeePrice: number;
        maxEmployees: number;
        maxCompanies: number;
    })[]>;
    updatePlan(id: string, data: {
        name?: string;
        employeePrice?: number;
        registrationFee?: number;
        maxEmployees?: number;
        description?: string;
    }): Promise<{
        features: {
            id: string;
            createdAt: Date;
            planId: string;
            featureName: string;
            isEnabled: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        name: string;
        description: string;
        registrationFee: number;
        price: number;
        employeePrice: number;
        maxEmployees: number;
        maxCompanies: number;
    }>;
}
declare const _default: AdminPlansService;
export default _default;
//# sourceMappingURL=adminPlans.service.d.ts.map