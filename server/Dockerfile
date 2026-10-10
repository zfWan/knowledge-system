# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app/server
RUN apk add --no-cache libc6-compat openssl python3 make g++
COPY package.json ./
RUN corepack enable && pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm prisma generate && pnpm build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/server
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
COPY package.json ./
RUN corepack enable && pnpm install --prod --frozen-lockfile=false
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY --from=builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./node_modules/@prisma
RUN mkdir -p data && chown -R node:node /app/server
USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
