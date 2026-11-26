import { Request, Response, NextFunction } from 'express';
import { Role, UserStatus } from '@prisma/client';
import prisma from '../config/db';
import { _decodeAccessToken } from '../services/auth.service';
import { AccessTokenPayload } from '../types/auth';
import { getBearerToken } from '../utils/authCookie';

declare global {
    namespace Express {
        interface Request {
            user?: AccessTokenPayload;
        }
    }
}

const unauthorized = (res: Response, message: string): void => {
    res.status(401).json({
        success: false,
        message,
    });
};

/**
 * Requires a valid access token bound to a live (not logged-out) login session
 * of an active SUPER_ADMIN user.
 */
export const requireSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Already verified earlier in this request (app-level guard + route-level guard)
        if (res.locals.superAdminVerified === true && req.user) {
            next();
            return;
        }

        const token = getBearerToken(req);
        if (!token) {
            unauthorized(res, 'No token provided');
            return;
        }

        // Rejects expired, malformed and legacy (sid-less) tokens
        const decoded = _decodeAccessToken(token);
        if (!decoded) {
            unauthorized(res, 'Invalid or expired token');
            return;
        }

        if (decoded.role !== Role.SUPER_ADMIN) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin rights required.',
            });
            return;
        }

        const session = await prisma.userLoginSession.findUnique({
            where: { id: decoded.sid },
            select: {
                userId: true,
                logoutAt: true,
                user: { select: { role: true, status: true } },
            },
        });

        const isSessionValid = session !== null
            && session.userId === decoded.id
            && session.logoutAt === null
            && session.user.role === Role.SUPER_ADMIN
            // A failed-login lock blocks new logins only; it does not end live sessions
            && session.user.status !== UserStatus.SUSPENDED;

        if (!isSessionValid) {
            unauthorized(res, 'Session expired. Please log in again.');
            return;
        }

        req.user = decoded;
        res.locals.superAdminVerified = true;
        next();
    } catch (error) {
        next(error);
    }
};
