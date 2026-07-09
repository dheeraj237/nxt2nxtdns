FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/src/lib/db/schema.sql ./src/lib/db/schema.sql
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server.js"]
