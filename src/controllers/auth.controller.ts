import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { HttpError } from '../utils/httpError';
import { clearRefreshCookie, getBearerToken, getRefreshCookie, setRefreshCookie } from '../utils/authCookie';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        const result = await authService.loginAdmin(email, password, {
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown',
        });

        setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await authService.refreshAdminSession(getRefreshCookie(req));

        setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
        res.status(200).json({
            success: true,
            message: 'Session refreshed',
            data: result.data,
        });
    } catch (error) {
        if (error instanceof HttpError && error.statusCode === 401) {
            clearRefreshCookie(res);
        }
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await authService.logoutAdmin(getRefreshCookie(req), getBearerToken(req));

        clearRefreshCookie(res);
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};
