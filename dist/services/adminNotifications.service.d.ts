export declare class AdminNotificationsService {
    sendNotification(userId: string, title: string, message: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        isRead: boolean;
        isDeleted: boolean;
    }>;
}
declare const _default: AdminNotificationsService;
export default _default;
//# sourceMappingURL=adminNotifications.service.d.ts.map