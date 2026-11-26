import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { HttpError } from '../utils/httpError';
import { validatePassword } from '../utils/validations/passwordValidation';

export const getProfile = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
    });
};

export const updateProfile = async (userId: string, data: { fullName?: string; email?: string }) => {
    if (data.email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email: data.email,
                NOT: { id: userId },
            },
        });

        if (existingUser) {
            throw new HttpError(409, 'Email already in use');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            fullName: data.fullName,
            email: data.email,
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
    });

    return updatedUser;
};

export const changePassword = async (
    userId: string,
    data: { currentPassword: string; newPassword: string },
    currentSessionId?: string
): Promise<{ message: string }> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.password) {
        throw new HttpError(404, 'User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
        throw new HttpError(400, 'Incorrect current password');
    }

    // Check 1: Plain text comparison (quick check)
    if (data.currentPassword === data.newPassword) {
        throw new HttpError(400, 'New password must be different from current password');
    }

    // Check 2: Compare with hashed password (extra security)
    const isSameAsCurrent = await bcrypt.compare(data.newPassword, user.password);
    if (isSameAsCurrent) {
        throw new HttpError(400, 'New password must be different from current password');
    }

    // Validate password strength
    const validation = validatePassword(data.newPassword);
    if (!validation.isValid) {
        throw new HttpError(400, validation.errors.join('. '));
    }

    // Hash new password with bcrypt cost 12
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
    });

    // Revoke every other active login session of this admin
    await prisma.userLoginSession.updateMany({
        where: {
            userId,
            logoutAt: null,
            ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { logoutAt: new Date() },
    });

    return { message: 'Password updated successfully' };
};