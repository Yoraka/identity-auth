import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 将处理函数包装成 RequestHandler
const asyncHandler = (fn: RequestHandler) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

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
router.get('/me', authMiddleware, asyncHandler(AuthController.me));
router.post('/logout', authMiddleware, asyncHandler(AuthController.logout));
router.post('/deactivate', authMiddleware, asyncHandler(AuthController.deactivate));
router.put('/face-features', authMiddleware, asyncHandler(AuthController.updateFaceFeatures));

export const authRouter = router; 