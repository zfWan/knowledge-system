# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app/web
COPY package.json ./
RUN corepack enable && pnpm install --frozen-lockfile=false
COPY . .
RUN pnpm build

# ---- runtime (nginx) ----
FROM nginx:alpine
COPY --from=builder /app/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
