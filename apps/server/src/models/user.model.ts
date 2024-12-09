import { pgPool } from '../utils/db';
import bcrypt from 'bcrypt';
import config from '../config';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  face_features: Buffer | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  faceFeatures?: Buffer;
}

export class UserModel {
  // 创建用户表
  static async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        face_features BYTEA,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await pgPool.query(createTableQuery);
      console.log('用户表创建成功');
    } catch (error) {
      console.error('创建用户表失败:', error);
      throw error;
    }
  }

  // 创建用户
  static async create(userData: CreateUserDTO): Promise<User> {
    const { username, email, password, faceFeatures } = userData;
    const passwordHash = await bcrypt.hash(password, config.security.bcryptSaltRounds);

    const query = `
      INSERT INTO users (username, email, password_hash, face_features)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    try {
      const result = await pgPool.query(query, [username, email, passwordHash, faceFeatures]);
      return result.rows[0];
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 通过用户名查找用户
  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1;';
    
    try {
      const result = await pgPool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  // 通过ID查找用户
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1;';
    
    try {
      const result = await pgPool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    }
  }

  // 更新用户人脸特征
  static async updateFaceFeatures(userId: number, faceFeatures: Buffer): Promise<User> {
    const query = `
      UPDATE users
      SET face_features = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;

    try {
      const result = await pgPool.query(query, [faceFeatures, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('更新人脸特征失败:', error);
      throw error;
    }
  }

  // 验证密码
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  // 通过ID删除用户
  static async deleteById(id: number): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1;';
    
    try {
      await pgPool.query(query, [id]);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }
} 