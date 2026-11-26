import { Request, Response, NextFunction } from 'express';
import adminNotificationsService from '../services/adminNotifications.service';

export const sendNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId, title, message } = req.body as { userId: string; title: string; message: string };

        const notification = await adminNotificationsService.sendNotification(userId, title, message);
        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};
