import { NextFunction, Request, Response } from 'express';
import * as adminProfileService from '../services/adminProfile.service';

export const getProfileDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id ?? '';
        const user = await adminProfileService.getProfile(userId);

        res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};


export const updateProfileDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id ?? '';
        const { fullName, email } = req.body as { fullName?: string; email?: string };

        const updatedUser = await adminProfileService.updateProfile(userId, { fullName, email });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id ?? '';
        const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

        // Other sessions of this admin are revoked after a successful password change
        const result = await adminProfileService.changePassword(userId, { currentPassword, newPassword }, req.user?.sid);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};
