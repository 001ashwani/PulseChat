# PulseChat 💬

A modern, full-stack real-time chat application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

![PulseChat](https://img.shields.io/badge/Stack-MERN-blue)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-orange)

## ✨ Features

- 🔐 **Authentication**: Secure JWT-based login and registration.
- 💬 **Real-time Messaging**: Instant message delivery using Socket.io.
- 🟢 **Presence Indicators**: See who's online and active.
- ✏️ **Typing Indicators**: Real-time "typing..." feedback.
- 📱 **Responsive Design**: Modern glassmorphism UI that works on mobile and desktop.
- 🚀 **Optimistic UI**: Instant message rendering for a smooth user experience.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS (v4), Axios, React Hot Toast.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: MongoDB (Mongoose).

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/pulsechat.git
cd pulsechat
```

### 2. Setup the Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```
Start the server:
```bash
npm start
```

### 3. Setup the Frontend
```bash
cd pulsechat-client
npm install
```
Start the dev server:
```bash
npm run dev
```

## 📄 License
MIT
