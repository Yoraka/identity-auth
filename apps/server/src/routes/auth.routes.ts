import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 将处理函数包装成正确的类型
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
};

// 公开路由
router.post('/register', asyncHandler(async (req, res) => {
  return AuthController.register(req, res);
}));

router.post('/login', asyncHandler(async (req, res) => {
  return AuthController.login(req, res);
}));

// 需要认证的路由
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  return AuthController.me(req, res);
}));

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  return AuthController.logout(req, res);
}));

router.post('/deactivate', authMiddleware, asyncHandler(async (req, res) => {
  return AuthController.deactivate(req, res);
}));

router.put('/face-features', authMiddleware, asyncHandler(async (req, res) => {
  return AuthController.updateFaceFeatures(req, res);
}));

export const authRouter = router; 