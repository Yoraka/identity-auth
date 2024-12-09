"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("./config"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const auth_middleware_1 = require("./middlewares/auth.middleware");
const user_model_1 = require("./models/user.model");
const db_1 = require("./utils/db");
const app = (0, express_1.default)();
// 中间件
app.use((0, cors_1.default)({
    origin: config_1.default.cors.origin,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(auth_middleware_1.loggingMiddleware);
// 路由
app.use('/api/auth', auth_routes_1.default);
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// 初始化数据库
async function initializeDatabase() {
    try {
        // 测试数据库连接
        const isConnected = await (0, db_1.testDatabaseConnection)();
        if (!isConnected) {
            throw new Error('数据库连接失败');
        }
        // 创建用户表
        await user_model_1.UserModel.createTable();
        console.log('数据库初始化成功');
    }
    catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}
// 启动服务器
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(config_1.default.server.port, () => {
            console.log(`服务器运行在 http://localhost:${config_1.default.server.port}`);
            console.log('环境:', config_1.default.server.nodeEnv);
        });
    }
    catch (error) {
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
