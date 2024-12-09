import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware, rateLimitMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 公开路由
router.post('/register', rateLimitMiddleware, AuthController.register);
router.post('/login', rateLimitMiddleware, AuthController.login);

// 需要认证的路由
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/deactivate', authMiddleware, AuthController.deactivate);
router.put('/face-features', authMiddleware, AuthController.updateFaceFeatures);

export default router; 