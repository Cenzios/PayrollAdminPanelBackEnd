"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminRevenue_controller_1 = require("../controllers/adminRevenue.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/summary', requireSuperAdmin_middleware_1.requireSuperAdmin, adminRevenue_controller_1.getRevenueSummary);
router.get('/invoices', requireSuperAdmin_middleware_1.requireSuperAdmin, adminRevenue_controller_1.getAllInvoices);
exports.default = router;
//# sourceMappingURL=admin.revenue.routes.js.map