"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const config_1 = __importDefault(require("../config"));
const db_1 = require("../utils/db");
class AuthService {
    // 生成JWT令牌
    static generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.default.jwt.secret, {
            expiresIn: config_1.default.jwt.expiresIn,
        });
    }
    // 计算认证分数
    static calculateAuthScore(factors) {
        let score = 0;
        if (factors.passwordValid)
            score += 0.5;
        if (factors.faceValid)
            score += 0.5;
        return score;
    }
    // 验证人脸特征
    static async verifyFace(faceFeatures, storedFeatures) {
        if (!faceFeatures || !storedFeatures) {
            return false;
        }
        // TODO: 实现人脸特征比对算法
        // 这里需要实现具体的人脸特征比对逻辑
        // 可以使用欧氏距离或余弦相似度等算法
        return true;
    }
    // 认证用户
    static async authenticate(credentials) {
        try {
            // 查找用户
            const user = await user_model_1.UserModel.findByUsername(credentials.username);
            if (!user) {
                return {
                    success: false,
                    score: 0,
                    message: '用户不存在',
                };
            }
            // 验证密码
            const passwordValid = await user_model_1.UserModel.verifyPassword(user, credentials.password);
            if (!passwordValid) {
                return {
                    success: false,
                    score: 0,
                    message: '密码错误',
                };
            }
            // 验证人脸特征
            const faceValid = await this.verifyFace(credentials.faceFeatures, user.face_features);
            // 计算认证分数
            const score = this.calculateAuthScore({
                passwordValid,
                faceValid,
            });
            // 如果认证成功，生成令牌
            if (score >= 1) {
                const token = this.generateToken(user);
                // 将令牌存储到Redis，用于会话管理
                await db_1.redisClient.set(`auth:${user.id}`, token, {
                    EX: 24 * 60 * 60, // 24小时过期
                });
                return {
                    success: true,
                    score,
                    token,
                    message: '认证成功',
                };
            }
            return {
                success: false,
                score,
                message: '认证失败，需要完成所有认证步骤',
            };
        }
        catch (error) {
            console.error('认证过程出错:', error);
            return {
                success: false,
                score: 0,
                message: '认证过程发生错误',
            };
        }
    }
    // 注销用户
    static async logout(userId) {
        try {
            // 从Redis中删除令牌
            await db_1.redisClient.del(`auth:${userId}`);
            return true;
        }
        catch (error) {
            console.error('注销失败:', error);
            return false;
        }
    }
    // 验证令牌
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            // 检查令牌是否在Redis中存在
            const storedToken = await db_1.redisClient.get(`auth:${decoded.userId}`);
            return storedToken === token;
        }
        catch (error) {
            console.error('令牌验证失败:', error);
            return false;
        }
    }
}
exports.AuthService = AuthService;
