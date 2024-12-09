import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { redisClient } from '../utils/db';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
      };
    }
  }
}

// 认证中间件
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '令牌格式错误',
      });
    }

    // 验证令牌
    const isValid = await AuthService.verifyToken(token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: '无效的令牌',
      });
    }

    // 从令牌中获取用户信息
    const userId = await AuthService.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '无效的用户信息',
      });
    }

    // 将用户信息添加到请求对象
    req.user = { userId, username: '', email: '' };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程发生错误',
    });
  }
}

// 速率限制中间件
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const key = `rateLimit:${ip}`;

  try {
    const requests = await redisClient.incr(key);
    
    // 如果是第一次请求，设置过期时间
    if (requests === 1) {
      await redisClient.expire(key, 900); // 15分钟
    }

    // 检查请求次数
    if (requests > 100) { // 每15分钟最多100次请求
      return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
    }

    next();
  } catch (error) {
    console.error('速率限制中间件错误:', error);
    // 如果Redis出错，允许请求通过
    next();
  }
}

// 日志中间件
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
} 