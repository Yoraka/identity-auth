import express from 'express';
import cors from 'cors';
import config from './config';
import authRoutes from './routes/auth.routes';
import { loggingMiddleware } from './middlewares/auth.middleware';
import { UserModel } from './models/user.model';
import { testDatabaseConnection } from './utils/db';

const app = express();

// 中间件
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.origin.some(allowedOrigin => allowedOrigin === origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// 路由
app.use('/api/auth', authRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 初始化数据库
async function initializeDatabase() {
  try {
    // 测试数据库连接
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('数据库连接失败');
    }

    // 创建用户表
    await UserModel.createTable();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(config.server.port, () => {
      console.log(`服务器运行在 http://localhost:${config.server.port}`);
      console.log('环境:', config.server.nodeEnv);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('未处理的Promise拒绝:', error);
  process.exit(1);
});

// 启动应用
startServer(); 