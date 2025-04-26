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

RUN pwd
RUN ls -alh .

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY /app/images/logo_tmp.png ./.next/static/images/logo_tmp.png
COPY /app/images/logosmall.ico ./.next/static/favicon.ico
COPY /app/images/logo_tmp.png ./images/logo_tmp.png
COPY /app/images/logosmall.ico ./favicon.ico
COPY /app/images/logosmall.ico ./logosmall.ico

RUN pwd
RUN ls -alh ./
RUN ls -alh ./images

CMD ["node", "server.js"]
# TODO End
