# TODO Start: [Student] Complete Dockerfile
FROM docker.net9.org/library/node:22 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN pnpm config set registry https://npm-cache-sepi.app.spring25a.secoder.net/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM docker.net9.org/library/node:22

ENV PORT=80

WORKDIR /app
# 复制构建产物
COPY --from=builder /app/.next /app/.next
#COPY --from=builder /app/instant-message/public /app/public
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules


CMD ["node", "server.js"]
# TODO End