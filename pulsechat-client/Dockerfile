# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY pulsechat-client/package*.json ./

RUN npm ci

COPY pulsechat-client . .

# Build frontend
RUN npm run build

# Runtime stage - use Nginx to serve
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY pulsechat-client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
