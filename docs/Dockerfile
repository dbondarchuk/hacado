# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat gcompat tzdata

# Install dependencies only when needed
FROM base AS deps

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY patches ./patches

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

COPY ./ ./

WORKDIR /app

RUN \
  if [ -f yarn.lock ]; then NODE_OPTIONS="--max-old-space-size=4096" yarn run build; \
  elif [ -f package-lock.json ]; then NODE_OPTIONS="--max-old-space-size=4096" npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && NODE_OPTIONS="--max-old-space-size=4096" pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs

COPY --from=builder /app ./

EXPOSE 3003

CMD ["yarn", "start"]
