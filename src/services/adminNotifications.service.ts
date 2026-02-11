import prisma from '../config/db';
import { NotificationType } from '@prisma/client';

export class AdminNotificationsService {
    async sendNotification(userId: string, title: string, message: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: NotificationType.INFO,
            },
        });
    }
}

export default new AdminNotificationsService();
