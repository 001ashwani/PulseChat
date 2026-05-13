# 🚀 Server Startup Guide

## Quick Start (Windows)

### Option 1: One-Click Startup
1. **Double-click:** `start-dev.bat` in the project root
2. Two console windows will open automatically
3. Frontend: http://localhost:5173
4. Backend: http://localhost:5000

### Option 2: Manual Startup

#### Backend (Terminal 1)
```bash
cd server
npm install
npm run dev
```

Expected output:
```
✅ MongoDB Connected
🚀 Server running on http://localhost:5000
Socket.io ready for real-time connections
```

#### Frontend (Terminal 2)
```bash
cd pulsechat-client
npm install
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in 1234 ms

➜  Local:   http://localhost:5173/
```

---

## Prerequisites

### Required
- **Node.js** 16+ (https://nodejs.org/)
- **npm** 8+ (comes with Node.js)
- **MongoDB** running locally or remote connection

### Optional
- **Git** (for version control)
- **VS Code** (recommended editor)

### Check Installation
```bash
node --version    # Should show v16.0.0 or higher
npm --version     # Should show 8.0.0 or higher
```

---

## Configuration

### Backend (.env file)

Create `server/.env` with:

```env
# Database (required)
MONGO_URI=mongodb://localhost:27017/pulsechat

# Security (required - generate unique secret)
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" >

# Ports
PORT=5000

# Environment
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste into `.env` as `JWT_SECRET`

### Frontend (.env file)

Create `pulsechat-client/.env` with:

```env
# API URL
VITE_API_URL=http://localhost:5000
```

---

## MongoDB Setup

### Local MongoDB

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB runs automatically on `mongodb://localhost:27017`

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### MongoDB Atlas (Cloud)

1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/pulsechat`
4. Add to `server/.env` as `MONGO_URI`

---

## Startup Troubleshooting

### Backend Won't Start

**Error: "MongoDB Connected" never shows**
- ✅ Check MongoDB is running: `mongosh` (should connect)
- ✅ Check `MONGO_URI` in `.env` is correct
- ✅ Check internet connection (for Atlas)

**Error: "Port 5000 already in use"**
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill -9
```

**Error: "Cannot find module"**
```bash
cd server
rm -rf node_modules
npm install
```

### Frontend Won't Start

**Error: "Port 5173 already in use"**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

**Error: "Cannot find module"**
```bash
cd pulsechat-client
rm -rf node_modules
npm install
```

### Connection Issues

**Error: "Cannot connect to backend"**
- ✅ Check backend is running: http://localhost:5000/health
- ✅ Check `VITE_API_URL` in frontend `.env`
- ✅ Check CORS: Should show "origin: http://localhost:5173" in `server/.env`

---

## Health Checks

### Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-14T00:00:00.000Z",
  "uptime": 123.45
}
```

### Frontend Loads
```bash
# Open in browser
http://localhost:5173
```

Expected: Login page loads

### Real-time Connection
Open browser DevTools (F12):
1. Go to **Console** tab
2. Log in with test account
3. Look for: `User connected: socketXXXX`
4. No errors should appear

---

## Common Tasks

### Clear Database
```bash
# In MongoDB shell (mongosh)
use pulsechat
db.dropDatabase()
```

### View Database
```bash
# In MongoDB shell
use pulsechat
db.users.find()
db.conversations.find()
db.messages.find()
```

### Reset Everything
```bash
# Stop servers (Ctrl+C)
# Backend
cd server && rm -rf node_modules && npm install

# Frontend
cd pulsechat-client && rm -rf node_modules && npm install

# Start again
# npm run dev (in both folders)
```

### View Logs
**Backend:** Check console window - all logs appear there  
**Frontend:** Browser DevTools → Console tab

---

## Testing the Installation

After both servers start:

1. **Create Account**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Fill in name, email, password
   - Click "Register"

2. **Test Real-time**
   - Open 2 browser windows (or tabs in incognito)
   - Log in as different users
   - One user sends message to the other
   - Message appears instantly ✅

3. **Test Features**
   - Upload image ✅
   - React with emoji ✅
   - Reply to message ✅
   - Create group ✅

---

## Stop Servers

**Method 1:** Close console windows (Ctrl+C)  
**Method 2:** Use Task Manager → End task `node.exe`  
**Method 3:** Run in VS Code → Click stop button

---

## Development Tips

### Hot Reload
- **Frontend:** Saves to file = instant reload ✅
- **Backend:** Nodemon watches files = auto-restart ✅

### Debug Mode
Add to `server/.env`:
```env
DEBUG=pulsechat:*
```

### Clear Cache
```bash
# Frontend
rm -rf pulsechat-client/.vite

# Browser: Ctrl+Shift+Delete → Clear cache
```

### Test with Multiple Users
- Open 2 browser windows (logged in as different users)
- Send messages, reactions, create groups
- Verify real-time updates work

---

## Production Deployment

See `DEPLOYMENT.md` for:
- Docker setup
- Database backups
- HTTPS/SSL
- Environment configuration
- Load balancing

---

## Quick Reference

| What | Where | URL |
|------|-------|-----|
| Frontend | http://localhost:5173 | Web app |
| Backend API | http://localhost:5000 | REST API |
| Health Check | http://localhost:5000/health | Status |
| WebSocket | ws://localhost:5000/socket.io | Real-time |

---

## Get Help

1. **Check logs:** Look in console windows
2. **Check docs:** Read README.md, LAUNCH_GUIDE.md
3. **Check GitHub:** Review commit messages for context
4. **Verify setup:** Run health checks above

---

**Server ready! Happy coding! 🚀**
