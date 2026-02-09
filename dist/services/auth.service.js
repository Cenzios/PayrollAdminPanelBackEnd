"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdmin = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const prisma = new client_1.PrismaClient();
const loginAdmin = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user || !user.password) {
        throw new Error('Invalid credentials');
    }
    if (user.role !== client_1.Role.SUPER_ADMIN) {
        throw new Error('Access denied. Super admin only.');
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
    }, jwt_1.jwtConfig.secret, { expiresIn: jwt_1.jwtConfig.expiresIn });
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
exports.loginAdmin = loginAdmin;
//# sourceMappingURL=auth.service.js.map