import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// @desc    Send a message
// @route   POST /api/messages/send/:id
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      conversationId: conversation._id,
      text,
    });

    await newMessage.save();

    // Update conversation lastMessage
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Note: Socket.io real-time sending is handled either in socketHandler.js or here.
    // If it's handled here, we'd need access to `io`. We'll just return the message
    // and rely on the client emitting the socket event after receiving the response,
    // or rely on the existing socket setup.

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error in sendMessage:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:id
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 }); // Sort by creation time ascending

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
