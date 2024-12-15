FROM alibaba-cloud-linux-3-registry.cn-hangzhou.cr.aliyuncs.com/alinux3/node:20.16 AS builder

WORKDIR /app

# 安装 pnpm
USER root
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm

# 首先只复制 package.json 文件
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

# 安装依赖
RUN pnpm install --frozen-lockfile --ignore-scripts

# 然后复制其他源代码文件
COPY . .

# 构建应用
RUN pnpm --filter web build

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