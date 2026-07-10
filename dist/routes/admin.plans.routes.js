"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminPlans_controller_1 = __importDefault(require("../controllers/adminPlans.controller"));
const requireSuperAdmin_middleware_1 = require("../middlewares/requireSuperAdmin.middleware");
const router = (0, express_1.Router)();
router.use(requireSuperAdmin_middleware_1.requireSuperAdmin);
router.get('/', adminPlans_controller_1.default.getAllPlans);
router.put('/:id', adminPlans_controller_1.default.updatePlan);
exports.default = router;
//# sourceMappingURL=admin.plans.routes.js.map