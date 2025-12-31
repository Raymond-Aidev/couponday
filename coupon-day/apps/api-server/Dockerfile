FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api-server/package.json ./apps/api-server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api-server ./apps/api-server

# Generate Prisma client
RUN cd apps/api-server && npx prisma generate

# Build
RUN pnpm --filter api-server build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built files
COPY --from=base /app/apps/api-server/dist ./dist
COPY --from=base /app/apps/api-server/package.json ./
COPY --from=base /app/apps/api-server/prisma ./prisma
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api-server/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
