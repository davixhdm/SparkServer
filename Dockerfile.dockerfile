# ====================================================================
# Stage 1: Development
# ====================================================================
FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "dev"]


# ====================================================================
# Stage 2: Production Build
# ====================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN npm run build


# ====================================================================
# Stage 3: Production Runtime
# ====================================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini

RUN addgroup -g 1001 spark && \
    adduser -D -u 1001 -G spark spark

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env.example ./.env.example

RUN mkdir -p /app/logs /app/uploads && \
    chown -R spark:spark /app

USER spark

EXPOSE 5000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]