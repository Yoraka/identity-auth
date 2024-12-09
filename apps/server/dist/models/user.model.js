"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = require("../utils/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config"));
class UserModel {
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
            await db_1.pgPool.query(createTableQuery);
            console.log('用户表创建成功');
        }
        catch (error) {
            console.error('创建用户表失败:', error);
            throw error;
        }
    }
    // 创建用户
    static async create(userData) {
        const { username, email, password, faceFeatures } = userData;
        const passwordHash = await bcrypt_1.default.hash(password, config_1.default.security.bcryptSaltRounds);
        const query = `
      INSERT INTO users (username, email, password_hash, face_features)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        try {
            const result = await db_1.pgPool.query(query, [username, email, passwordHash, faceFeatures]);
            return result.rows[0];
        }
        catch (error) {
            console.error('创建用户失败:', error);
            throw error;
        }
    }
    // 通过用户名查找用户
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1;';
        try {
            const result = await db_1.pgPool.query(query, [username]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('查找用户失败:', error);
            throw error;
        }
    }
    // 更新用户人脸特征
    static async updateFaceFeatures(userId, faceFeatures) {
        const query = `
      UPDATE users
      SET face_features = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
        try {
            const result = await db_1.pgPool.query(query, [faceFeatures, userId]);
            return result.rows[0];
        }
        catch (error) {
            console.error('更新人脸特征失败:', error);
            throw error;
        }
    }
    // 验证密码
    static async verifyPassword(user, password) {
        return bcrypt_1.default.compare(password, user.password_hash);
    }
}
exports.UserModel = UserModel;
