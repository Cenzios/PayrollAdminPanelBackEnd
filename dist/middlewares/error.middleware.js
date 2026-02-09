"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (error, _req, res, _next) => {
    console.error('Error:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const response = {
        success: false,
        message,
    };
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map