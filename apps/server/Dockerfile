FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16 AS builder

WORKDIR /app

# 安装 pnpm
USER root
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm

# 首先只复制 package.json 文件
COPY package.json pnpm-lock.yaml ./
COPY apps/server/package.json ./apps/server/

# 安装依赖
RUN pnpm install

# 安装类型定义
RUN pnpm add -D @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/dotenv @types/pg @types/redis

# 然后复制其他源代码文件
COPY . .

# 确保 ts-node-dev 安装正确
RUN cd apps/server && pnpm install

# 生产环境镜像
FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16

WORKDIR /app

# 创建 node 用户并设置权限
RUN mkdir -p /app && chown -R node:node /app

# 切换到 node 用户
USER node

# 复制必要的文件
COPY --from=builder --chown=node:node /app/apps/server/src ./src
COPY --from=builder --chown=node:node /app/apps/server/package.json ./package.json
COPY --from=builder --chown=node:node /app/apps/server/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/server/tsconfig.json ./tsconfig.json

# 设置生产环境变量
ENV NODE_ENV=production

# 设置可执行权限
USER root
RUN chmod +x /app/node_modules/.bin/*
USER node

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["npm", "run", "dev"]