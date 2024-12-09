"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_model_1 = require("../models/user.model");
class AuthController {
    // 用户注册
    static async register(req, res) {
        try {
            const { username, email, password, faceFeatures } = req.body;
            // 验证必要字段
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名、邮箱和密码为必填项',
                });
            }
            // 检查用户是否已存在
            const existingUser = await user_model_1.UserModel.findByUsername(username);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: '用户名已存在',
                });
            }
            // 创建新用户
            const user = await user_model_1.UserModel.create({
                username,
                email,
                password,
                faceFeatures: faceFeatures ? Buffer.from(faceFeatures) : undefined,
            });
            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        }
        catch (error) {
            console.error('注册失败:', error);
            res.status(500).json({
                success: false,
                message: '注册过程发生错误',
            });
        }
    }
    // 用户登录
    static async login(req, res) {
        try {
            const { username, password, faceFeatures } = req.body;
            // 验证必要字段
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: '用户名和密码为必填项',
                });
            }
            // 进行认证
            const authResult = await auth_service_1.AuthService.authenticate({
                username,
                password,
                faceFeatures: faceFeatures ? Buffer.from(faceFeatures) : undefined,
            });
            if (authResult.success) {
                res.status(200).json({
                    success: true,
                    message: '登录成功',
                    data: {
                        token: authResult.token,
                        score: authResult.score,
                    },
                });
            }
            else {
                res.status(401).json({
                    success: false,
                    message: authResult.message,
                    score: authResult.score,
                });
            }
        }
        catch (error) {
            console.error('登录失败:', error);
            res.status(500).json({
                success: false,
                message: '登录过程发生错误',
            });
        }
    }
    // 用户注销
    static async logout(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '未提供用户ID',
                });
            }
            const success = await auth_service_1.AuthService.logout(userId);
            if (success) {
                res.status(200).json({
                    success: true,
                    message: '注销成功',
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '注销失败',
                });
            }
        }
        catch (error) {
            console.error('注销失败:', error);
            res.status(500).json({
                success: false,
                message: '注销过程发生错误',
            });
        }
    }
    // 更新人脸特征
    static async updateFaceFeatures(req, res) {
        try {
            const userId = req.user?.userId;
            const { faceFeatures } = req.body;
            if (!userId || !faceFeatures) {
                return res.status(400).json({
                    success: false,
                    message: '用户ID和人脸特征数据为必填项',
                });
            }
            const user = await user_model_1.UserModel.updateFaceFeatures(userId, Buffer.from(faceFeatures));
            res.status(200).json({
                success: true,
                message: '人脸特征更新成功',
                data: {
                    id: user.id,
                    username: user.username,
                },
            });
        }
        catch (error) {
            console.error('更新人脸特征失败:', error);
            res.status(500).json({
                success: false,
                message: '更新人脸特征过程发生错误',
            });
        }
    }
}
exports.AuthController = AuthController;
