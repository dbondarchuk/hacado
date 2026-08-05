# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tzdata

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY --parents apps/notification-sender/package.json .
COPY --parents packages/*/package.json .

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy everything except other apps
COPY --parents apps/notification-sender ./
COPY --parents packages ./
COPY --parents *.* ./

# Build the notification sender app
RUN \
  if [ -f yarn.lock ]; then yarn run build --filter=@hacado/notification-sender; \
  elif [ -f package-lock.json ]; then npm run build --filter=@hacado/notification-sender; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build --filter=@hacado/notification-sender; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 notification-sender

# Copy only the built application
COPY --from=builder --chown=notification-sender:nodejs /app/apps/notification-sender/dist ./dist
COPY --from=builder --chown=notification-sender:nodejs /app/apps/notification-sender/package.json ./package.json

# Copy necessary node_modules for runtime
COPY --from=builder /app/node_modules/@aws-sdk ./node_modules/@aws-sdk
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

USER notification-sender

CMD ["node", "dist/index.js"]
