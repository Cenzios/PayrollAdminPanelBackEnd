import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../utils/validations/passwordValidation';

const prisma = new PrismaClient();

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
            throw new Error('Email already in use');
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

export const changePassword = async (userId: string, data: { currentPassword: string; newPassword: string }) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.password) {
        throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect current password');
    }

    // Check 1: Plain text comparison (quick check)
    if (data.currentPassword === data.newPassword) {
        throw new Error('New password must be different from current password');
    }

    // Check 2: Compare with hashed password (extra security)
    const isSameAsCurrent = await bcrypt.compare(data.newPassword, user.password);
    if (isSameAsCurrent) {
        throw new Error('New password must be different from current password');
    }

    // Validate password strength
    const validation = validatePassword(data.newPassword);
    if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
    }

    // Hash new password with bcrypt cost 12
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
    });

    return { message: 'Password updated successfully' };
};