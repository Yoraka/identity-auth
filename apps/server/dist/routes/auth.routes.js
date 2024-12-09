"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// 公开路由
router.post('/register', auth_middleware_1.rateLimitMiddleware, auth_controller_1.AuthController.register);
router.post('/login', auth_middleware_1.rateLimitMiddleware, auth_controller_1.AuthController.login);
// 需要认证的路由
router.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.logout);
router.put('/face-features', auth_middleware_1.authMiddleware, auth_controller_1.AuthController.updateFaceFeatures);
exports.default = router;
