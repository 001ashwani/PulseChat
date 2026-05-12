# PulseChat 💬

A modern, full-stack real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io, with enterprise-grade security and production-ready features.

![PulseChat](https://img.shields.io/badge/Stack-MERN-blue)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-orange)
![Security](https://img.shields.io/badge/Security-Production%20Ready-green)

## ✨ Features

- 🔐 **Advanced Authentication**: Secure JWT-based login with password strength requirements
- 💬 **Real-time Messaging**: Instant message delivery using Socket.io
- 🟢 **Presence Indicators**: See who's online and active in real-time
- ✏️ **Typing Indicators**: Real-time "typing..." feedback
- 📱 **Responsive Design**: Modern glassmorphism UI that works on mobile and desktop
- 🚀 **Optimistic UI**: Instant message rendering for a smooth user experience
- 🛡️ **Production Security**: Rate limiting, CORS, HTTPS, security headers (Helmet.js)
- 📊 **Structured Logging**: Winston logger with error tracking ready
- ✅ **Input Validation**: Zod validation for all API inputs
- 🗃️ **Database Indexes**: Optimized MongoDB queries with proper indexing

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Axios, React Hot Toast
- **Backend**: Node.js, Express 5, Socket.io
- **Database**: MongoDB (Mongoose)
- **Security**: Helmet.js, express-rate-limit, bcryptjs, JWT
- **Logging**: Winston
- **Validation**: Zod

## 📋 Requirements

- Node.js 18+
- npm 9+
- MongoDB (Atlas or local instance)
- Internet connection for package downloads

## 🚀 Quick Start (Development)

### 1. Clone and Setup

```bash
git clone https://github.com/YOUR_USERNAME/pulsechat.git
cd pulsechat
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Minimum .env configuration:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/pulsechat
JWT_SECRET=your_dev_secret_key_here_min_32_chars
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
```

### 3. Start Backend

```bash
# Development with hot reload
npm run dev

# Or production
npm start
```

Server will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd pulsechat-client

# Install dependencies
npm install

# Start dev server
npm run dev
```

Client will run on `http://localhost:5173`

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase, lowercase, numbers, special characters (!@#$%^&*)
- Hashed with bcryptjs (12 salt rounds)

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Registration: 3 per hour
- General API: 100 requests per 15 minutes
- Messages: 1000 per hour

### Input Validation
- Email format validation
- Message content sanitization
- Name field constraints
- All inputs validated with Zod

### Security Headers (Helmet.js)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security
- Referrer-Policy

## 📚 Documentation

- **[SECURITY.md](./SECURITY.md)** - Security best practices and hardening guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (Docker, Nginx, SSL)
- **[API Documentation](#api-endpoints)** - API endpoints reference

## 🏗️ Project Structure

```
pulsechat/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware (auth, rate limiting)
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── sockets/           # Socket.io handlers
│   ├── utils/             # Utilities (validation, logging, tokens)
│   ├── server.js          # Main server file
│   └── package.json
├── pulsechat-client/       # Frontend
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   ├── context/       # React context
│   │   ├── api/           # API utilities
│   │   ├── hooks/         # Custom hooks
│   │   └── App.jsx        # Main app component
│   ├── vite.config.js
│   └── package.json
├── SECURITY.md            # Security documentation
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePass123!"
  }
  ```

- `POST /api/auth/logout` - Logout (requires auth token)

### Users

- `GET /api/users` - Get all users (requires auth)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Messages

- `GET /api/messages` - Get messages for conversation
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

## 🧪 Testing

Run tests (when implemented):
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd pulsechat-client && npm test
```

## 📦 Building for Production

### Backend
```bash
cd server
npm install --production
# Set NODE_ENV=production and configure .env
npm start
```

### Frontend
```bash
cd pulsechat-client
npm install
npm run build
# Output will be in dist/
```

## 🐳 Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Docker setup.

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/pulsechat

# JWT
JWT_SECRET=your_secret_key_min_32_characters
JWT_EXPIRE=7d

# Client
CLIENT_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `sudo systemctl start mongod`
- Check MONGO_URI in .env
- Verify IP whitelist if using MongoDB Atlas

### Port Already in Use
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

### CORS Errors
- Ensure CLIENT_URL is correct in .env
- Check both server and client URLs match

### Rate Limit Being Hit
- Check application logs for unusual patterns
- Adjust rate limit settings in `server/middleware/rateLimiter.js`

## 📈 Performance Optimization

- Database indexes configured for common queries
- Connection pooling enabled for MongoDB
- Frontend optimized with Vite and React compiler
- Socket.io configured with websocket and polling transports
- Nginx reverse proxy recommended for static file serving

## 🛣️ Roadmap

- [ ] Refresh token system implementation
- [ ] Group/channel chats
- [ ] File upload & sharing
- [ ] Message reactions & replies
- [ ] User search & friend lists
- [ ] Message encryption
- [ ] Mobile apps (React Native)
- [ ] Video/voice calling
- [ ] Message history export

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Support

For issues, questions, or suggestions:

1. Check [SECURITY.md](./SECURITY.md) for security-related questions
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
3. Open an issue on GitHub
4. Contact the development team

## 🔗 Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Socket.io Guide](https://socket.io/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Built with ❤️ by the PulseChat Team**

⭐ If you find this project helpful, please star it on GitHub!

