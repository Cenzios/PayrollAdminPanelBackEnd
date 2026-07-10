"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
exports.jwtConfig = {
    secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET is required'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || (() => { throw new Error('JWT_EXPIRES_IN is required'); })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || (() => { throw new Error('JWT_REFRESH_EXPIRES_IN is required'); })(),
};
//# sourceMappingURL=jwt.js.map