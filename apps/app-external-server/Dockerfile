# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tzdata

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY --parents apps/app-external-server/package.json .
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
COPY --parents apps/app-external-server ./
COPY --parents packages ./
COPY --parents *.* ./

# Build the app external server
RUN \
  if [ -f yarn.lock ]; then yarn run build --filter=@hacado/app-external-server; \
  elif [ -f package-lock.json ]; then npm run build --filter=@hacado/app-external-server; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build --filter=@hacado/app-external-server; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app-server

# Copy only the built application
COPY --from=builder --chown=app-server:nodejs /app/apps/app-external-server/dist ./dist
COPY --from=builder --chown=app-server:nodejs /app/apps/app-external-server/package.json ./package.json

# Copy necessary node_modules for runtime
COPY --from=builder /app/node_modules/@aws-sdk ./node_modules/@aws-sdk
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder /app/node_modules/@resvg ./node_modules/@resvg
COPY --from=builder /app/node_modules/pdfkit/js/data ./dist/data

USER app-server

EXPOSE 5556

ENV PORT=5556

CMD ["node", "dist/index.js"]

