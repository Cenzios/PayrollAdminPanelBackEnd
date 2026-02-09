"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const updateProfile = async (userId, data) => {
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
exports.updateProfile = updateProfile;
const changePassword = async (userId, data) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user || !user.password) {
        throw new Error('User not found');
    }
    const isMatch = await bcryptjs_1.default.compare(data.currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect current password');
    }
    const hashedPassword = await bcryptjs_1.default.hash(data.newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
        },
    });
    return { message: 'Password updated successfully' };
};
exports.changePassword = changePassword;
//# sourceMappingURL=adminProfile.service.js.map