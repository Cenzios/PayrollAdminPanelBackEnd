import prisma from '../config/db';
import { Notification, NotificationType } from '@prisma/client';
import { HttpError } from '../utils/httpError';

export class AdminNotificationsService {
    async sendNotification(userId: string, title: string, message: string): Promise<Notification> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new HttpError(404, 'User not found');
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
