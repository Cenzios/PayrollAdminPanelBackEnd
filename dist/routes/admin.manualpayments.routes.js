"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_manualpayments_controller_1 = require("../controllers/admin.manualpayments.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/', requireSuperAdmin_middleware_1.requireSuperAdmin, admin_manualpayments_controller_1.getPendingPayments);
router.post('/:id/approve', requireSuperAdmin_middleware_1.requireSuperAdmin, admin_manualpayments_controller_1.approvePayment);
router.post('/:id/reject', requireSuperAdmin_middleware_1.requireSuperAdmin, admin_manualpayments_controller_1.rejectPayment);
exports.default = router;
//# sourceMappingURL=admin.manualpayments.routes.js.map