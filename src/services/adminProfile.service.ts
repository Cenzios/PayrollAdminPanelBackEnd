import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
    // If email is being changed, check if it's already taken
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
    });

    return { message: 'Password updated successfully' };
};
