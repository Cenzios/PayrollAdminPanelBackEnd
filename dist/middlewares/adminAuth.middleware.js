"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../config/jwt");
const protectAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'No token provided',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.secret);
        if (decoded.role !== 'SUPER_ADMIN') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Super admin only.',
            });
            return;
        }
        req.admin = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
exports.protectAdmin = protectAdmin;
//# sourceMappingURL=adminAuth.middleware.js.map