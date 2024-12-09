# 身份鉴别系统

基于双因素认证的身份鉴别系统，使用 Next.js 14 + Express.js + TypeScript 实现。

## 项目结构

```
identity-auth/
├── apps/
│   ├── web/                      # Next.js 前端
│   └── server/                   # Express 后端
└── packages/
    └── shared/                   # 共享代码
```

## 技术栈

- 前端：Next.js 14 + shadcn/ui + TypeScript
- 后端：Express.js + TypeScript
- 数据库：PostgreSQL + Redis
- 部署：Docker + Docker Compose

## 开发环境要求

- Node.js >= 18
- pnpm >= 8
- Docker
- Docker Compose

## 开始开发

1. 安装依赖：
```bash
pnpm install
```

2. 启动开发服务器：
```bash
# 启动所有服务
pnpm dev

# 或者分别启动
pnpm --filter @identity-auth/web dev
pnpm --filter @identity-auth/server dev
```

3. 构建项目：
```bash
pnpm build
```

4. 运行测试：
```bash
pnpm test
```

## Docker部署

1. 构建镜像：
```bash
docker-compose build
```

2. 启动服务：
```bash
docker-compose up -d
```

3. 查看日志：
```bash
docker-compose logs -f
```

4. 停止服务：
```bash
docker-compose down
```

## 项目特性

- 双因素认证（密码 + 人脸识别）
- 用户管理
- 安全审计
- 实时人脸采集
- 活体检测
- 高性能缓存
- 安全存储 