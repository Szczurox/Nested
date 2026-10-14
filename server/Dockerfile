FROM node:22-bookworm-slim AS build

WORKDIR /app

# Install build tools and openssl required for native modules (like argon2) and prisma
RUN apt-get update \
  && apt-get install --no-install-recommends --yes build-essential python3 openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
# Prisma validates the datasource during client generation. The real URL is
# injected by Compose at runtime; this placeholder is only for code generation.
ENV DATABASE_URL=postgresql://nested:nested@localhost:5432/nested?schema=public
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies in the build stage so we have a clean production node_modules ready to copy
RUN npm prune --production

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install --no-install-recommends --yes openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodeapp \
  && useradd --system --uid 1001 --gid nodeapp nodeapp

# Copy the already-built and pruned node_modules from the build stage (avoids recompiling native modules)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./

RUN mkdir -p /app/uploads \
  && chmod +x docker-entrypoint.sh \
  && chown -R nodeapp:nodeapp /app

USER nodeapp
EXPOSE 4000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]