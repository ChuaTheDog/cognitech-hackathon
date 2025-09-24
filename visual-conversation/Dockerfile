FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
RUN apk add --no-cache libc6-compat

COPY package.json bun.lock ./
RUN bun install

FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV AZURE_SPEECH_KEY=placeholder \
    AZURE_SPEECH_REGION=placeholder \
    AZURE_OPENAI_ENDPOINT=placeholder \
    AZURE_OPENAI_KEY=placeholder \
    AZURE_OPENAI_DEPLOYMENT_NAME=placeholder \
    ELEVENLABS_API_KEY=placeholder
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs
EXPOSE ${APPLICATION_PORT:-3000}

CMD ["node", "server.js"]


