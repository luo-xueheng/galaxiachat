# TODO Start: [Student] Complete Dockerfile
# ✅ 第 1 阶段：构建阶段，安装依赖并构建 Next.js
FROM node:22 as builder

# 设置工作目录
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# 安装 pnpm 并换源加速
RUN corepack enable && \
    pnpm config set registry https://npm-cache-sepi.app.spring25a.secoder.net/ && \
    pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Next.js 独立服务端
RUN pnpm build

# ✅ 第 2 阶段：生产环境，仅包含运行所需的文件
FROM node:22 as runner

# 设置运行环境变量
ENV NODE_ENV=production
ENV PORT=80

# 设置工作目录
WORKDIR /app

# 复制构建后的 Next.js 独立服务端
COPY --from=builder /app/.next/standalone /app
COPY --from=builder /app/public /app/public
COPY --from=builder /app/.next/static /app/.next/static

# 运行服务器
CMD ["node", "server.js"]
# TODO End
