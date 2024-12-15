import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 将异步处理函数包装成 Express 中间件
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res);
      // 不返回 Response 对象，让 Express 处理响应
    } catch (error) {
      next(error);
    }
  };
};

// 公开路由
router.post('/register', asyncHandler((req, res) => AuthController.register(req, res)));
router.post('/login', asyncHandler((req, res) => AuthController.login(req, res)));

// 需要认证的路由
router.get('/me', authMiddleware, asyncHandler((req, res) => AuthController.me(req, res)));
router.post('/logout', authMiddleware, asyncHandler((req, res) => AuthController.logout(req, res)));
router.post('/deactivate', authMiddleware, asyncHandler((req, res) => AuthController.deactivate(req, res)));
router.put('/face-features', authMiddleware, asyncHandler((req, res) => AuthController.updateFaceFeatures(req, res)));

export const authRouter = router; 