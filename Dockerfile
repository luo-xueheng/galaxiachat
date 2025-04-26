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
RUN ls -al .
RUN ls -al ./favicon.ico 

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY /app/images/logo_tmp.png ./.next/static/images/logo_tmp.png
COPY /app/images/logosmall.ico ./.next/static/logosmall.ico
COPY /app/images/logosmall.ico ./.next/static/favicon.ico
COPY /app/images/logosmall.ico ./favicon.ico

RUN pwd
RUN ls -al ./
RUN ls -al ./.next 
RUN ls -al ./.next/static
RUN ls -al ./.next/static/images
RUN ls -al ./.next/static/chunks
RUN ls -al ./.next/static/media
RUN ls -al ./.next/static/css

CMD ["node", "server.js"]
# TODO End
