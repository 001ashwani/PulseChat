# PulseChat - Launch Guide

## 🚀 Quick Launch (5 minutes)

### Option 1: Docker (Recommended)

```bash
# 1. Copy and customize environment
cp .env.docker.example .env.docker

# 2. Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and add to .env.docker as JWT_SECRET

# 3. Edit Docker environment
nano .env.docker
# Update:
#   - MONGO_INITDB_ROOT_PASSWORD
#   - JWT_SECRET

# 4. Start all services
docker-compose up -d

# 5. Verify it's running
docker-compose logs -f server
# Look for: "✅ MongoDB Connected" and "🚀 Server running"

# 6. Access the app
# Frontend: http://localhost
# API: http://localhost:5000/api
# Health: http://localhost:5000/health
```

### Option 2: Local Development

```bash
# Backend
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm run dev

# Frontend (in new terminal)
cd pulsechat-client
npm install
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

### Option 3: Production Linux Server

See `DEPLOYMENT.md` for complete instructions:
- Server setup
- HTTPS/SSL configuration
- Nginx reverse proxy
- Database backups
- Monitoring setup

---

## 📝 Configuration Quick Reference

### Essential Environment Variables

```env
# Security (MUST GENERATE)
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >

# Database
MONGO_URI=mongodb://user:pass@host:27017/pulsechat

# URLs
CLIENT_URL=http://localhost  (or https://yourdomain.com)

# Modes
NODE_ENV=development  (or production)
```

### Generate JWT Secret

```bash
# Mac/Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Post-Launch Checklist

### Immediate (Day 1)
- [ ] App loads and responds to requests
- [ ] Can register new user
- [ ] Can login with that user
- [ ] Can send messages in real-time
- [ ] Check `/health` endpoint returns 200
- [ ] Review logs for errors: `docker-compose logs`

### Before Production (Week 1)
- [ ] Test with 10+ concurrent users
- [ ] Verify HTTPS/SSL working
- [ ] Check rate limiting works (try 6 failed logins)
- [ ] Verify database backups running
- [ ] Setup error monitoring (Sentry)
- [ ] Configure log aggregation
- [ ] Perform security audit

### Ongoing (Weekly)
- [ ] Review error logs
- [ ] Check rate limit violations
- [ ] Monitor disk space
- [ ] Verify backups are working
- [ ] Update dependencies if needed

---

## 🔍 Troubleshooting

### App Won't Start

**Error: "ENOENT: no such file or directory"**
```bash
# Make sure .env file exists
ls -la server/.env

# Should show: -rw-r--r-- 1 user group ... server/.env
```

**Error: "MongoDB connection failed"**
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Or for local MongoDB:
mongo --eval "db.runCommand('ping')"

# Check connection string in .env
echo $MONGO_URI
```

**Error: "Port already in use"**
```bash
# Stop other services using port
lsof -i :5000
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Can't Login

**"Invalid password requirements"**
- Password needs: 8+ chars, uppercase, lowercase, number, special char (!@#$%^&*)
- Example: `MyPass123!` ✅
- Bad: `password` ❌, `Pass123` ❌

**"Email already registered"**
- Use different email or reset database:
```bash
docker-compose down -v  # Removes all data
docker-compose up -d    # Fresh start
```

### Rate Limited

**"Too many login attempts"**
- You've tried 5+ failed logins in 15 minutes
- Wait 15 minutes or restart server:
```bash
docker-compose restart server
```

---

## 📊 Monitoring

### Check Server Health

```bash
# Is it responding?
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"2026-05-13T12:00:00Z","uptime":3600}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just server
docker-compose logs -f server

# Just client
docker-compose logs -f client

# Just database
docker-compose logs -f mongodb

# Search for errors
docker-compose logs | grep -i error
```

### Check Resource Usage

```bash
# CPU, Memory, Network
docker stats

# Database disk usage
docker exec pulsechat-mongodb du -sh /data/db
```

---

## 🔒 Security Verification

### Test Password Requirements

```bash
# Try registering with weak password:
# Should fail - "password"
# Should succeed - "MySecurePass123!"
```

### Test Rate Limiting

```bash
# Try 6 failed logins:
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6th should fail with 429 Too Many Requests
```

### Test Security Headers

```bash
# Should see Helmet headers:
curl -I http://localhost:5000

# Look for:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

---

## 📊 Testing Real Usage

### Load Testing

```bash
# Install ab (Apache Bench)
sudo apt install apache2-utils  # Ubuntu/Debian
brew install httpd              # Mac

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/health

# Better tool: wrk
wrk -t4 -c100 -d30s http://localhost:5000/health
```

### User Flow Testing

1. **Register**
   - Email: test@example.com
   - Password: TestPass123!
   - Name: Test User

2. **Login**
   - Use registered email and password
   - Should receive JWT token

3. **Send Message**
   - Open chat
   - Type message
   - Should appear immediately

4. **Real-time Features**
   - Open in 2 browsers
   - See typing indicator
   - See online/offline status
   - Messages sync instantly

---

## 🔄 Stopping & Restarting

### Stop All Services

```bash
docker-compose down
# Data is preserved in volumes
```

### Stop & Remove Everything

```bash
docker-compose down -v
# WARNING: Removes all data
```

### Restart Services

```bash
docker-compose restart

# Or specific service:
docker-compose restart server
```

---

## 📈 Performance Optimization

### Verify Indexes

```bash
# Connect to MongoDB
docker exec -it pulsechat-mongodb mongosh -u admin -p password

# Check indexes
db.users.getIndexes()
db.messages.getIndexes()

# Should show multiple indexes for fast queries
```

### Monitor Database

```bash
# Check query performance
docker exec pulsechat-mongodb mongosh -u admin -p password \
  --eval "db.setProfilingLevel(1)"

# View slow queries
docker exec pulsechat-mongodb mongosh -u admin -p password \
  --eval "db.system.profile.find().limit(5).pretty()"
```

---

## 🆘 Emergency Procedures

### Restore from Backup

```bash
# MongoDB Atlas:
# 1. Go to Atlas > Backups > Select snapshot
# 2. Click "Restore" > Follow prompts

# Local:
# Contact your backup service provider
```

### Force Database Refresh

```bash
# WARNING: Deletes all data
docker-compose down -v
docker-compose up -d

# Give it 30 seconds to initialize
sleep 30
```

### View All Data (MongoDB)

```bash
docker exec pulsechat-mongodb mongosh -u admin -p password
show dbs
use pulsechat
db.users.find()
db.messages.find().limit(10)
```

---

## 📞 Getting Help

### Documentation
- **SECURITY.md** - Security & best practices
- **DEPLOYMENT.md** - Full deployment guide
- **CHANGELOG.md** - What was changed
- **README.md** - Features & setup

### Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 busy | Change PORT in .env or kill process |
| Can't connect to MongoDB | Check MONGO_URI, verify MongoDB running |
| Weak password error | Add uppercase, lowercase, number, special char |
| Rate limited | Wait 15 min or restart service |
| Static files 404 | Rebuild frontend: `npm run build` |

### Debug Mode

```bash
# Set debug logging
export LOG_LEVEL=debug

# Or in .env
LOG_LEVEL=debug

# Restart
docker-compose restart server

# View detailed logs
docker-compose logs -f server
```

---

## 🎉 Success Indicators

Your PulseChat is ready when:

✅ `/health` endpoint returns 200  
✅ Can register new user  
✅ Can login with that user  
✅ Can send and receive messages in real-time  
✅ See presence indicators (online/offline)  
✅ See typing indicators  
✅ Logs show no errors  
✅ Rate limiting kicks in after 5 failed logins  

---

## 🚀 You're All Set!

PulseChat is now **production-ready** with:
- Enterprise security features
- Database optimization
- Error handling
- Structured logging
- Rate limiting
- Full documentation

**Time to launch! 🎊**

For detailed information, see the documentation files:
- `SECURITY.md` - Security details
- `DEPLOYMENT.md` - Production deployment
- `CHANGELOG.md` - All changes made
