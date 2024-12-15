FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制项目文件
COPY . .

# 安装依赖并构建
RUN pnpm install
RUN pnpm --filter api build

# 生产环境镜像
FROM node:18-alpine

WORKDIR /app

# 复制构建产物和必要文件
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json .
COPY --from=builder /app/apps/api/node_modules ./node_modules

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["node", "dist/main.js"] 