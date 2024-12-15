import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user.model';

export class AuthController {
  // 用户注册
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { username, email, password, faceFeatures } = req.body;

      // 打印请求数据（不包含敏感信息）
      console.log('注册请求数据:', {
        username,
        email,
        hasFaceFeatures: !!faceFeatures,
        faceDataType: faceFeatures ? typeof faceFeatures : 'undefined',
        faceDataLength: faceFeatures ? faceFeatures.length : 0
      });

      // 验证必要字段
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码为必填项',
        });
      }

      // 验证人脸特征数据
      if (!faceFeatures || !Array.isArray(faceFeatures)) {
        return res.status(400).json({
          success: false,
          message: '人脸特征数据无效',
          details: {
            hasFaceFeatures: !!faceFeatures,
            type: typeof faceFeatures
          }
        });
      }

      // 验证人脸特征数据长度
      if (faceFeatures.length !== 128) {
        return res.status(400).json({
          success: false,
          message: '人脸特征数据长度不正确',
          details: {
            expectedLength: 128,
            actualLength: faceFeatures.length
          }
        });
      }

      // 检查用户是否已存在
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '用户名已存在',
        });
      }

      try {
        // 将特征数据转换为 Buffer
        const faceBuffer = Buffer.from(new Float32Array(faceFeatures).buffer);
        console.log('人脸特征Buffer:', {
          length: faceBuffer.length,
          sample: faceBuffer.slice(0, 20)
        });

        // 创建新用户
        const user = await UserModel.create({
          username,
          email,
          password,
          faceFeatures: faceBuffer
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
      } catch (dbError) {
        console.error('数据库操作失败:', dbError);
        throw new Error('创建用户失败，请稍后重试');
      }
    } catch (error) {
      // 详细记录错误
      console.error('注册失败:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        requestBody: {
          username: req.body.username,
          email: req.body.email,
          hasFaceFeatures: !!req.body.faceFeatures
        }
      });

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '注册过程发生错误',
      });
    }
    return res.status(200).json({ /* ... */ });
  }

  // 用户登录
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password, faceFeatures } = req.body;

      // 验证必要字段
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码为必填项',
        });
      }

      // 查找用户
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          score: 0,
          message: '用户不存在',
        });
      }

      // 验证密码
      const passwordValid = await UserModel.verifyPassword(user, password);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          score: 0,
          message: '密码错误',
        });
      }

      // 如果没有提供人脸特征数据，说明是第一步验证
      if (!faceFeatures) {
        return res.status(200).json({
          success: true,
          score: 0.5,
          message: '密码验证通过，请进行人脸验证',
        });
      }

      // 验证人脸特征
      const faceValid = await AuthService.verifyFace(faceFeatures, user.face_features);
      if (!faceValid) {
        return res.status(401).json({
          success: false,
          score: 0.5,
          message: '人脸验证失败',
        });
      }

      // 生成令牌
      const token = await AuthService.generateToken(user);
      
      // 将令牌存储到Redis
      await AuthService.storeToken(user.id, token);

      return res.status(200).json({
        success: true,
        score: 1,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        score: 0,
        message: '登录过程发生错误',
      });
    }
    return res.status(200).json({ /* ... */ });
  }

  // 用户注销
  static async logout(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未提供用户ID',
        });
      }

      const success = await AuthService.logout(userId);
      if (success) {
        res.status(200).json({
          success: true,
          message: '注销成功',
        });
      } else {
        res.status(500).json({
          success: false,
          message: '注销失败',
        });
      }
    } catch (error) {
      console.error('注销失败:', error);
      res.status(500).json({
        success: false,
        message: '注销过程发生错误',
      });
    }
  }

  // 更新人脸特征
  static async updateFaceFeatures(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { faceFeatures } = req.body;

      if (!userId || !faceFeatures) {
        return res.status(400).json({
          success: false,
          message: '用户ID和人脸特征数据为必填项',
        });
      }

      const user = await UserModel.updateFaceFeatures(userId, Buffer.from(faceFeatures));
      
      res.status(200).json({
        success: true,
        message: '人脸���征更新成功',
        data: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error('更新人脸特征失败:', error);
      res.status(500).json({
        success: false,
        message: '更新人脸特征过程发生错误',
      });
    }
  }

  // 获取当前用户信息
  static async me(req: Request, res: Response) {
    try {
      console.log('获取用户信息请求:', {
        headers: req.headers,
        user: req.user
      });

      const userId = req.user?.userId;
      if (!userId) {
        console.log('未找到用户ID');
        return res.status(401).json({
          success: false,
          message: '未认证',
        });
      }

      const user = await UserModel.findById(userId);
      console.log('查询到的用户:', {
        found: !!user,
        userId
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
      });
    }
  }

  // 注销账号
  static async deactivate(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌',
        });
      }

      const token = authHeader.split(' ')[1];
      const isValid = await AuthService.verifyToken(token);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: '认证令牌无效或已过期',
        });
      }

      const userId = await AuthService.getUserIdFromToken(token);
      
      // 删除用户数据
      await UserModel.deleteById(userId);
      
      // 删除Redis中的令牌
      await AuthService.logout(userId);

      res.json({
        success: true,
        message: '账号已注销',
      });
    } catch (error) {
      console.error('注销账号失败:', error);
      res.status(500).json({
        success: false,
        message: '注销账号失败',
      });
    }
  }
} 