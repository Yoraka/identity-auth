"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.pgPool = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
exports.closeDatabaseConnection = closeDatabaseConnection;
const pg_1 = require("pg");
const redis_1 = require("redis");
const config_1 = __importDefault(require("../config"));
// PostgreSQL连接池
exports.pgPool = new pg_1.Pool({
    host: config_1.default.database.host,
    port: config_1.default.database.port,
    database: config_1.default.database.database,
    user: config_1.default.database.user,
    password: config_1.default.database.password,
});
// Redis客户端
exports.redisClient = (0, redis_1.createClient)({
    url: config_1.default.redis.url,
});
// 初始化Redis连接
exports.redisClient.connect().catch(console.error);
// Redis错误处理
exports.redisClient.on('error', (err) => console.error('Redis Client Error:', err));
// 数据库连接测试
async function testDatabaseConnection() {
    try {
        // 测试PostgreSQL连接
        const pgClient = await exports.pgPool.connect();
        console.log('PostgreSQL连接成功');
        pgClient.release();
        // 测试Redis连接
        await exports.redisClient.ping();
        console.log('Redis连接成功');
        return true;
    }
    catch (error) {
        console.error('数据库连接测试失败:', error);
        return false;
    }
}
// 关闭数据库连接
async function closeDatabaseConnection() {
    try {
        await exports.pgPool.end();
        await exports.redisClient.quit();
        console.log('数据库连接已关闭');
    }
    catch (error) {
        console.error('关闭数据库连接时出错:', error);
    }
}
