# Build stage
FROM node:18-alpine as build-server

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --only=production

COPY server . .

# Runtime stage  
FROM node:18-alpine

WORKDIR /app

COPY --from=build-server /app/node_modules ./node_modules
COPY server .

# Create logs directory
RUN mkdir -p logs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if(r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
