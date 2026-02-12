import { Response } from 'express';
import * as adminProfileService from '../services/adminProfile.service';

export const getProfileDetails = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await adminProfileService.getProfile(userId);

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to fetch profile',
        });
    }
};


export const updateProfileDetails = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fullName, email } = req.body;

        const updatedUser = await adminProfileService.updateProfile(userId, { fullName, email });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update profile',
        });
    }
};

export const updatePassword = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current and new passwords are required',
            });
        }

        const result = await adminProfileService.changePassword(userId, { currentPassword, newPassword });

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to update password',
        });
    }
};
