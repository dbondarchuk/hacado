# syntax=docker/dockerfile:1.7-labs

FROM node:22-alpine AS base
RUN apk add --no-cache fontconfig ttf-dejavu font-opensans tzdata && \
        fc-cache -f

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat 

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY --parents apps/web/package.json .
COPY --parents packages/*/package.json .

COPY patches/ ./patches

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
ARG MONGODB_URI=mongodb://mongo:27017/hacado?retryWrites=true&w=majority
# ENV NODE_OPTIONS="--max_old_space_size=4096"

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy everything except other apps
COPY --parents apps/web ./
COPY --parents packages ./
COPY --parents *.* ./

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f yarn.lock ]; then NODE_OPTIONS="--max-old-space-size=4096" yarn run build --filter=@hacado/web; \
  elif [ -f package-lock.json ]; then NODE_OPTIONS="--max-old-space-size=4096" npm run build --filter=@hacado/web; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && NODE_OPTIONS="--max-old-space-size=4096" pnpm run build --filter=@hacado/web; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node apps/web/server.js