const onlineUsers = new Map(); // Map userId -> socketId

const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('user_connected', (userId) => {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.emit('initial_online_users', Array.from(onlineUsers.keys()));
      io.emit('user_status', { userId, status: 'online' });
    });

    socket.on('send_message', (data) => {
      const receiverSocketId = onlineUsers.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', data);
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      const s = onlineUsers.get(receiverId);
      if (s) io.to(s).emit('typing', { senderId });
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
      const s = onlineUsers.get(receiverId);
      if (s) io.to(s).emit('stop_typing', { senderId });
    });

    socket.on('messages_read', async ({ senderId, receiverId }) => {
      const senderSocketId = onlineUsers.get(senderId);
      try {
        const Message = (await import('../models/Message.js')).default;
        const Conversation = (await import('../models/Conversation.js')).default;
        const conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] }
        });
        if (conversation) {
          await Message.updateMany(
            { conversationId: conversation._id, senderId: senderId, seen: false },
            { $set: { seen: true } }
          );
        }
      } catch (e) {
        console.error('Error updating read status in socket', e);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages_read', { receiverId });
      }
    });

    socket.on('message_deleted', ({ messageId, receiverId }) => {
      const s = onlineUsers.get(receiverId);
      if (s) io.to(s).emit('message_deleted', { messageId });
    });

    socket.on('message_reaction', ({ messageId, reactions, receiverId }) => {
      const s = onlineUsers.get(receiverId);
      if (s) io.to(s).emit('message_reaction', { messageId, reactions });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId) {
        if (onlineUsers.get(socket.userId) === socket.id) {
          onlineUsers.delete(socket.userId);
          io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen: new Date() });
        }
      }
    });
  });
};

export default setupSockets;
