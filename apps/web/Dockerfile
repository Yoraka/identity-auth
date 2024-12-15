FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16 AS builder

WORKDIR /app

# 安装 pnpm
USER root
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm

# 首先复制所有 package.json
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# 安装所有依赖
RUN pnpm install

# 复制源代码
COPY . .

# 确保依赖正确安装并构建
RUN cd apps/web && pnpm install && NEXT_TELEMETRY_DISABLED=1 pnpm build

# 生产环境镜像
FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16

WORKDIR /app

# 创建 node 用户并设置权限
RUN mkdir -p /app && chown -R node:node /app

# 切换到 node 用户
USER node

# 复制必要的文件
COPY --from=builder --chown=node:node /app/apps/web/.next ./.next
COPY --from=builder --chown=node:node /app/apps/web/public ./public
COPY --from=builder --chown=node:node /app/apps/web/package.json ./package.json
COPY --from=builder --chown=node:node /app/apps/web/node_modules ./node_modules

# 设置生产环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 设置可执行权限
USER root
RUN chmod +x /app/node_modules/.bin/*
USER node

# 暴露端口
EXPOSE 3000

# 修改启动命令
CMD ["npx", "next", "start"] 