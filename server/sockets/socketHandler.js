const onlineUsers = new Map(); // Map userId -> socketId

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user logs in / connects with their user ID
    socket.on('user_connected', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} mapped to socket ${socket.id}`);
      // Broadcast to all that this user is online
      io.emit('user_status', { userId, status: 'online' });
    });

    // Handle sending message
    socket.on('send_message', (data) => {
      // data: { receiverId, senderId, text, conversationId, ... }
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        // Send message to receiver
        io.to(receiverSocketId).emit('receive_message', data);
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stop_typing', { senderId });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen: new Date() });
      }
    });
  });
};

export default setupSockets;
