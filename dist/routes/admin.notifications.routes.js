"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminNotifications_controller_1 = require("../controllers/adminNotifications.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.post('/send', requireSuperAdmin_middleware_1.requireSuperAdmin, adminNotifications_controller_1.sendNotification);
exports.default = router;
//# sourceMappingURL=admin.notifications.routes.js.map