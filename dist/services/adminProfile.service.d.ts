export declare const updateProfile: (userId: string, data: {
    fullName?: string;
    email?: string;
}) => Promise<{
    id: string;
    email: string;
    fullName: string;
    role: import(".prisma/client").$Enums.Role;
}>;
export declare const changePassword: (userId: string, data: {
    currentPassword: string;
    newPassword: string;
}) => Promise<{
    message: string;
}>;
//# sourceMappingURL=adminProfile.service.d.ts.map