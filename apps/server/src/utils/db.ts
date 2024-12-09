import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import config from '../config';

// PostgreSQL连接池
export const pgPool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

// Redis客户端
export const redisClient: RedisClientType = createClient({
  url: config.redis.url,
});

// 初始化Redis连接
redisClient.connect().catch((err: Error) => {
  console.error('Redis连接错误:', err);
});

// Redis错误处理
redisClient.on('error', (err: Error) => {
  console.error('Redis客户端错误:', err);
});

// 数据库连接测试
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // 测试PostgreSQL连接
    const pgClient = await pgPool.connect();
    console.log('PostgreSQL连接成功');
    pgClient.release();

    // 测试Redis连接
    await redisClient.ping();
    console.log('Redis连接成功');

    return true;
  } catch (error) {
    console.error('数据库连接测试失败:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// 关闭数据库连接
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pgPool.end();
    await redisClient.quit();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error instanceof Error ? error.message : String(error));
  }
} 