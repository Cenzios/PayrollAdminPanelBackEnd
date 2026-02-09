"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminAudit_controller_1 = require("../controllers/adminAudit.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/', requireSuperAdmin_middleware_1.requireSuperAdmin, adminAudit_controller_1.getAuditLogs);
exports.default = router;
//# sourceMappingURL=admin.audit.routes.js.map