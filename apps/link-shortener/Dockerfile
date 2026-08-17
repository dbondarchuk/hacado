# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tzdata

FROM base AS deps
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY --parents apps/link-shortener/package.json .
COPY --parents packages/*/package.json .

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY --parents apps/link-shortener ./
COPY --parents packages ./
COPY --parents *.* ./

RUN \
  if [ -f yarn.lock ]; then yarn run build --filter=@hacado/link-shortener; \
  elif [ -f package-lock.json ]; then npm run build --filter=@hacado/link-shortener; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build --filter=@hacado/link-shortener; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 link-shortener

COPY --from=builder --chown=link-shortener:nodejs /app/apps/link-shortener/dist ./dist
COPY --from=builder --chown=link-shortener:nodejs /app/apps/link-shortener/package.json ./package.json

COPY --from=builder /app/node_modules/@aws-sdk ./node_modules/@aws-sdk
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

USER link-shortener

EXPOSE 5557

ENV PORT=5557

CMD ["node", "dist/index.js"]
