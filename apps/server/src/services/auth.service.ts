import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import config from '../config';
import { redisClient } from '../utils/db';

export interface AuthResult {
  success: boolean;
  score: number;
  token?: string;
  message?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
  faceFeatures?: Buffer | number[];
}

export class AuthService {
  // 生成JWT令牌
  static async generateToken(user: User): Promise<string> {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // 存储令牌到Redis
  static async storeToken(userId: number, token: string): Promise<void> {
    await redisClient.set(`auth:${userId}`, token, {
      EX: 24 * 60 * 60, // 24小时过期
    });
  }

  // 验证人脸特征
  static async verifyFace(faceFeatures: Buffer | number[] | undefined, storedFeatures: Buffer | null): Promise<boolean> {
    if (!faceFeatures || !storedFeatures) {
      console.log('缺少人脸特征数据');
      return false;
    }

    try {
      // 将输入特征转换为 Float32Array
      let inputFeatures: Float32Array;
      if (Array.isArray(faceFeatures)) {
        inputFeatures = new Float32Array(faceFeatures);
      } else {
        // 确保 Buffer 长度是 Float32Array 元素大小的倍数
        if (faceFeatures.length % 4 !== 0) {
          console.error('Buffer 长度不是 4 的倍数');
          return false;
        }
        inputFeatures = new Float32Array(faceFeatures.buffer, faceFeatures.byteOffset, faceFeatures.length / 4);
      }

      // 确保存储的特征 Buffer 长度是 Float32Array 元素大小的倍数
      if (storedFeatures.length % 4 !== 0) {
        console.error('存储的特征 Buffer 长度不是 4 的倍数');
        return false;
      }

      // 将存储的特征转换为 Float32Array
      const storedFeaturesArray = new Float32Array(
        storedFeatures.buffer,
        storedFeatures.byteOffset,
        storedFeatures.length / 4
      );

      console.log('特征数据:', {
        inputLength: inputFeatures.length,
        storedLength: storedFeaturesArray.length,
        inputSample: Array.from(inputFeatures).slice(0, 5),
        storedSample: Array.from(storedFeaturesArray).slice(0, 5)
      });

      // 验证特征向量长度
      if (inputFeatures.length !== 128 || storedFeaturesArray.length !== 128) {
        console.error('特征向量长度不正确:', {
          inputLength: inputFeatures.length,
          storedLength: storedFeaturesArray.length,
          expected: 128
        });
        return false;
      }

      // 计算欧氏距离
      const distance = this.calculateEuclideanDistance(inputFeatures, storedFeaturesArray);
      console.log('人脸特征欧氏距离:', distance);

      // 设置阈值（调整为更合适的值）
      const threshold = 0.45;
      const isMatch = distance < threshold;

      console.log('人脸验证结果:', {
        distance,
        threshold,
        isMatch
      });

      return isMatch;
    } catch (error) {
      console.error('人脸特征比对失败:', error);
      return false;
    }
  }

  // 计算欧氏距离
  private static calculateEuclideanDistance(arr1: Float32Array, arr2: Float32Array): number {
    if (arr1.length !== arr2.length) {
      throw new Error('特征向量长度不匹配');
    }

    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      const diff = arr1[i] - arr2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // 注销用户
  static async logout(userId: number): Promise<boolean> {
    try {
      // 从Redis中删除令牌
      await redisClient.del(`auth:${userId}`);
      return true;
    } catch (error) {
      console.error('注销失败:', error);
      return false;
    }
  }

  // 验证令牌
  static async verifyToken(token: string): Promise<boolean> {
    try {
      console.log('验证令牌:', { token });
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
      console.log('解码的令牌:', { decoded });
      
      // 检查令牌是否在Redis中存在
      const storedToken = await redisClient.get(`auth:${decoded.userId}`);
      console.log('存储的令牌:', {
        userId: decoded.userId,
        storedToken,
        matches: storedToken === token
      });

      return storedToken === token;
    } catch (error) {
      console.error('令牌验证失败:', error);
      return false;
    }
  }

  // 从令牌中获取用户ID
  static async getUserIdFromToken(token: string): Promise<number> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
      console.log('从令牌获取用户ID:', { decoded });
      return decoded.userId;
    } catch (error) {
      console.error('从令牌获取用户ID失败:', error);
      throw new Error('无效的令牌');
    }
  }
} 