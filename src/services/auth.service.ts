import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

const prisma = new PrismaClient();

export const loginAdmin = async (email: string, password: string): Promise<any> => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        throw new Error('Invalid credentials');
    }

    // Check if user is SUPER_ADMIN
    if (user.role !== Role.SUPER_ADMIN) {
        throw new Error('Access denied. Super admin only.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn as any }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    };
};
