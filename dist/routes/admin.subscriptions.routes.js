"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminSubscriptions_controller_1 = require("../controllers/adminSubscriptions.controller");
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.get('/', requireSuperAdmin_middleware_1.requireSuperAdmin, adminSubscriptions_controller_1.getAllSubscriptions);
router.get('/user/:userId', requireSuperAdmin_middleware_1.requireSuperAdmin, adminSubscriptions_controller_1.getSubscriptionTimeline);
exports.default = router;
//# sourceMappingURL=admin.subscriptions.routes.js.map