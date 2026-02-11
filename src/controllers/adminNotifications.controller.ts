import { Request, Response } from 'express';
import adminNotificationsService from '../services/adminNotifications.service';

export const sendNotification = async (req: Request, res: Response) => {
    try {
        const { userId, title, message } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'userId, title, and message are required'
            });
        }

        const notification = await adminNotificationsService.sendNotification(userId, title, message);
        return res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send notification'
        });
    }
};
