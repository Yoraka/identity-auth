import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 公开路由
router.post('/register', async (req, res, next) => {
  try {
    await AuthController.register(req, res);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    await AuthController.login(req, res);
  } catch (error) {
    next(error);
  }
});

// 需要认证的路由
router.get('/me', authMiddleware, AuthController.me);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/deactivate', authMiddleware, AuthController.deactivate);
router.put('/face-features', authMiddleware, AuthController.updateFaceFeatures);

export const authRouter = router; 