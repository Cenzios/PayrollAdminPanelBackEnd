"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = 'Error', statusCode = 500, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors,
    });
};
exports.errorResponse = errorResponse;
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
};
exports.paginatedResponse = paginatedResponse;
//# sourceMappingURL=response.js.map