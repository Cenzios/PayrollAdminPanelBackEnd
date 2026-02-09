"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const db_1 = __importDefault(require("../config/db"));
const auditLog = (action, resource) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.admin?.id;
            const ipAddress = req.ip || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';
            if (userId) {
                await db_1.default.auditLog.create({
                    data: {
                        userId,
                        action,
                        resourceType: resource,
                        httpMethod: req.method,
                        endpoint: req.originalUrl,
                        ipAddress,
                        userAgent,
                        statusCode: res.statusCode,
                    },
                });
            }
            next();
        }
        catch (error) {
            console.error('Audit log error:', error);
            next();
        }
    };
};
exports.auditLog = auditLog;
//# sourceMappingURL=audit.middleware.js.map