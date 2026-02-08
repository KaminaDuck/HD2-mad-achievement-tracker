# Stage 1: Build frontend
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json vite.config.ts index.html ./
COPY src/ src/

RUN bun run build

# Stage 2: Production
FROM oven/bun:1-slim
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Built frontend
COPY --from=builder /app/dist/client/ dist/client/

# Server source (Bun runs TypeScript directly)
COPY tsconfig.json ./
COPY src/server/ src/server/
COPY src/shared/ src/shared/

# Achievement definitions
COPY data/achievements.json data/

# Directories for runtime data
RUN mkdir -p /app/data /app/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["bun", "-e", "const r = await fetch('http://localhost:3001/health'); if(!r.ok) process.exit(1)"]

CMD ["bun", "run", "src/server/serve.ts"]
