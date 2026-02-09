"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminSecurity_controller_1 = require("../controllers/adminSecurity.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/login-sessions', requireSuperAdmin_middleware_1.requireSuperAdmin, adminSecurity_controller_1.getLoginSessions);
router.get('/suspicious', requireSuperAdmin_middleware_1.requireSuperAdmin, adminSecurity_controller_1.getSuspiciousActivity);
exports.default = router;
//# sourceMappingURL=admin.security.routes.js.map