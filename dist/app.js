"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_dashboard_routes_1 = __importDefault(require("./routes/admin.dashboard.routes"));
const admin_users_routes_1 = __importDefault(require("./routes/admin.users.routes"));
const admin_companies_routes_1 = __importDefault(require("./routes/admin.companies.routes"));
const admin_subscriptions_routes_1 = __importDefault(require("./routes/admin.subscriptions.routes"));
const admin_security_routes_1 = __importDefault(require("./routes/admin.security.routes"));
const admin_audit_routes_1 = __importDefault(require("./routes/admin.audit.routes"));
const admin_revenue_routes_1 = __importDefault(require("./routes/admin.revenue.routes"));
const admin_profile_routes_1 = __importDefault(require("./routes/admin.profile.routes"));
const requireSuperAdmin_middleware_1 = require("./middlewares/requireSuperAdmin.middleware");
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/admin', limiter);
app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Payroll Admin Backend API is running',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin/dashboard', admin_dashboard_routes_1.default);
app.use('/api/admin/users', admin_users_routes_1.default);
app.use('/api/admin/companies', admin_companies_routes_1.default);
app.use('/api/admin/subscriptions', admin_subscriptions_routes_1.default);
app.use('/api/admin/security', requireSuperAdmin_middleware_1.requireSuperAdmin, admin_security_routes_1.default);
app.use('/api/admin/audit', requireSuperAdmin_middleware_1.requireSuperAdmin, admin_audit_routes_1.default);
app.use('/api/admin/revenue', admin_revenue_routes_1.default);
app.use('/api/admin/profile', admin_profile_routes_1.default);
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map