import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }

        const result = await authService.loginAdmin(email, password);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result,
        });
    } catch (error: any) {
        if (error.message === 'Invalid credentials' || error.message === 'Access denied. Super admin only.') {
            res.status(401).json({
                success: false,
                message: error.message,
            });
        } else {
            next(error);
        }
    }
};
