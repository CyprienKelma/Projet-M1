# -------------------------------------
# Step 1: Build stage
# -------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copy dependency files and install
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source files last (to maximize cache)
COPY . .

# Build the NestJS project for production
RUN pnpm build

# -------------------------------------
# Step 2: Runtime stage (prepared early)
# -------------------------------------
FROM node:22-alpine AS runtime-base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# -------------------------------------
# Step 3: Final image (code only, fast copy)
# -------------------------------------
FROM runtime-base AS final

WORKDIR /app

# Copy built code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env .env
COPY --from=builder /app/src/scripts/test-image.png ./dist/scripts/

EXPOSE 3000

CMD ["node", "dist/main"]
