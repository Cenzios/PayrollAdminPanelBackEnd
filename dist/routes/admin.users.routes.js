"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminUsers_controller_1 = require("../controllers/adminUsers.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/', requireSuperAdmin_middleware_1.requireSuperAdmin, adminUsers_controller_1.getAllUsers);
router.get('/:userId', requireSuperAdmin_middleware_1.requireSuperAdmin, adminUsers_controller_1.getUserById);
exports.default = router;
//# sourceMappingURL=admin.users.routes.js.map