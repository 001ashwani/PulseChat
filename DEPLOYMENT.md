# PulseChat Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Production Server Setup](#production-server-setup)
5. [MongoDB Atlas Setup](#mongodb-atlas-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling](#scaling)

## Prerequisites

- Node.js 18+ and npm
- Docker (for containerized deployment)
- MongoDB Atlas account
- Domain name
- SSL certificate (Let's Encrypt free option available)
- Linux server (Ubuntu 20.04 LTS recommended)

## Environment Setup

### 1. Generate Required Secrets

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 2. Create Production .env File

Create `server/.env` with:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/pulsechat?retryWrites=true&w=majority
JWT_SECRET=your_generated_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
LOG_LEVEL=info
```

## Docker Deployment

### 1. Build Docker Images

**Server Dockerfile** - Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["npm", "start"]
```

**Client Dockerfile** - Create `pulsechat-client/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=https://api.yourdomain.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose** - Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  server:
    build:
      context: ./server
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/pulsechat
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=7d
      - CLIENT_URL=https://yourdomain.com
      - LOG_LEVEL=info
    volumes:
      - ./server/logs:/app/logs
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  client:
    build:
      context: ./pulsechat-client
      args:
        VITE_API_BASE_URL: https://api.yourdomain.com
    ports:
      - "3000:80"
    restart: always
    depends_on:
      - server

volumes:
  mongodb_data:
```

### 2. Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Server Setup

### 1. Server Infrastructure

Recommended specs:
- **CPU**: 2+ cores
- **RAM**: 4GB+ 
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 20.04 LTS or newer

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install SSL tools
sudo apt install -y certbot python3-certbot-nginx

# Install Docker (optional)
sudo apt install -y docker.io docker-compose
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/pulsechat.git
cd pulsechat

# Install backend dependencies
cd server
npm install --production

# Create and configure .env
nano .env
# Add your production variables

# Test backend
npm start

# With PM2
pm2 start server.js --name "pulsechat-server"
pm2 save
pm2 startup

# Build frontend
cd ../pulsechat-client
npm install
npm run build
```

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project
3. Create a cluster:
   - **Provider**: AWS
   - **Region**: Choose closest to your servers
   - **Cluster Tier**: M0 (free) or higher
   - **Enable**: Encryption at rest

### 2. Configure Security

1. **Network Access**:
   - Add your server's public IP
   - Add `0.0.0.0/0` for development only

2. **Database Access**:
   - Create database user with strong password
   - Use `pulsechat` as username or similar

3. **Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pulsechat?retryWrites=true&w=majority
   ```

### 3. Backups

- Enable daily backups (included in paid tier)
- Configure point-in-time restore
- Test backup restoration regularly

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (runs daily)
sudo certbot renew --dry-run

# Certificate location
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## Reverse Proxy (Nginx)

### Nginx Configuration

Create `/etc/nginx/sites-available/pulsechat`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/pulsechat_access.log;
    error_log /var/log/nginx/pulsechat_error.log;

    # Client
    location / {
        root /var/www/pulsechat/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

### Enable Configuration

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/pulsechat /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable on boot
sudo systemctl enable nginx
```

## Monitoring & Logging

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Save configuration
pm2 save
```

### Nginx Logs

```bash
# View access logs
tail -f /var/log/nginx/pulsechat_access.log

# View error logs
tail -f /var/log/nginx/pulsechat_error.log

# Log analysis
grep "error" /var/log/nginx/pulsechat_error.log
```

### Application Logs

```bash
# View application logs
tail -f server/logs/combined.log
tail -f server/logs/error.log
```

## Scaling

### Horizontal Scaling

For multiple servers:

1. **Load Balancer**: Use Nginx or cloud provider's load balancer
2. **Session Management**: Use Redis for session storage
3. **Database Replication**: MongoDB Atlas handles this
4. **File Storage**: Use cloud storage (AWS S3, etc.)

### Redis Configuration (for sessions)

```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### PM2 Cluster Mode

```bash
# Start in cluster mode
pm2 start server.js -i max

# View cluster
pm2 show server
```

## Health Checks

Monitor application health:

```bash
# Check server health
curl https://yourdomain.com/health

# Response should be:
# {"status":"ok","timestamp":"2024-05-13T12:00:00Z","uptime":3600}
```

## Backup & Recovery

### Database Backups

MongoDB Atlas handles daily backups. To restore:

1. Go to Backups section in Atlas
2. Select snapshot
3. Click "Restore" and follow prompts

### Application Code

```bash
# Regular Git commits and pushes
git push origin main

# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## Troubleshooting

### Port Already in Use

```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh "mongodb+srv://user:password@cluster.mongodb.net/pulsechat"

# Check IP whitelist in Atlas
```

## Maintenance

### Regular Tasks

- [ ] Weekly: Check logs for errors
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review resource usage
- [ ] Quarterly: Security audit
- [ ] Annually: Penetration testing

### Update Procedure

```bash
# Test updates
npm update

# Run tests
npm test

# Commit changes
git add package*.json
git commit -m "chore: update dependencies"

# Deploy
pm2 restart pulsechat-server
```

## Support & Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Production Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Documentation](https://docs.mongodb.com/)
