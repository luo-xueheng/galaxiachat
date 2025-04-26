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

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public/images/ ./
COPY --from=builder /app/public/logosmall.ico ./favicon.ico
COPY --from=builder /app/public/logosmall.ico ./logosmall.ico

CMD ["node", "server.js"]
# TODO End
