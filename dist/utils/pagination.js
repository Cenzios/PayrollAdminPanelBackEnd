"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalPages = exports.getPaginationParams = void 0;
const getPaginationParams = (page, limit) => {
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page || 1;
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit || 10;
    const validPage = parsedPage > 0 ? parsedPage : 1;
    const validLimit = parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10;
    return {
        page: validPage,
        limit: validLimit,
        skip: (validPage - 1) * validLimit,
    };
};
exports.getPaginationParams = getPaginationParams;
const calculateTotalPages = (total, limit) => {
    return Math.ceil(total / limit);
};
exports.calculateTotalPages = calculateTotalPages;
//# sourceMappingURL=pagination.js.map