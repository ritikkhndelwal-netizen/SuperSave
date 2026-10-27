# Production Dockerfile for SuperSave API Gateway
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    API_PORT=4000

# Install dependencies
COPY package*.json ./
COPY services/api/package*.json ./services/api/
RUN npm --workspace services/api i --omit=dev

# Copy application source code
COPY services/api ./services/api

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:${API_PORT:-4000}/health || exit 1

CMD ["npx", "tsx", "services/api/src/index.ts"]
