FROM node:22-alpine AS base
WORKDIR /app

# better-sqlite3 needs to compile a native addon
RUN apk add --no-cache python3 make g++

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/server/package.json ./apps/server/package.json
RUN npm install --workspace apps/server --include-workspace-root

FROM deps AS build
COPY apps/server ./apps/server
RUN npm run build --workspace apps/server

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/src/db/migrations ./apps/server/dist/db/migrations
COPY apps/server/package.json ./apps/server/package.json

WORKDIR /app/apps/server
VOLUME ["/app/apps/server/data"]
EXPOSE 4000
CMD ["node", "dist/index.js"]
