"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.rateLimitMiddleware = rateLimitMiddleware;
exports.loggingMiddleware = loggingMiddleware;
const auth_service_1 = require("../services/auth.service");
const db_1 = require("../utils/db");
// 认证中间件
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: '未提供认证令牌' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: '令牌格式错误' });
        }
        // 验证令牌
        const isValid = await auth_service_1.AuthService.verifyToken(token);
        if (!isValid) {
            return res.status(401).json({ message: '无效的令牌' });
        }
        next();
    }
    catch (error) {
        console.error('认证中间件错误:', error);
        res.status(500).json({ message: '认证过程发生错误' });
    }
}
// 速率限制中间件
async function rateLimitMiddleware(req, res, next) {
    const ip = req.ip;
    const key = `rateLimit:${ip}`;
    try {
        const requests = await db_1.redisClient.incr(key);
        // 如果是第一次请求，设置过期时间
        if (requests === 1) {
            await db_1.redisClient.expire(key, 900); // 15分钟
        }
        // 检查请求次数
        if (requests > 100) { // 每15分钟最多100次请求
            return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
        }
        next();
    }
    catch (error) {
        console.error('速率限制中间件错误:', error);
        // 如果Redis出错，允许请求通过
        next();
    }
}
// 日志中间件
function loggingMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
}
