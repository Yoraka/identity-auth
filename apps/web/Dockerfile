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
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN cd apps/web && pnpm install && NEXT_TELEMETRY_DISABLED=1 pnpm build || true

# 生产环境镜像
FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16

WORKDIR /app

# 复制必要的文件
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/node_modules ./node_modules

# 设置生产环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["npm", "start"] 