import User from '../models/User.js';

// @desc    Get users for sidebar
// @route   GET /api/users
// @access  Private
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch all users except the current user, exclude passwords
    const users = await User.find({ _id: { $ne: currentUserId } }).select('-password').lean();

    // Attach unread counts and last messages
    const enrichedUsers = await Promise.all(users.map(async (u) => {
      // Find conversation between current user and this user
      const conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, u._id] }
      });

      let unreadCount = 0;
      let lastMessagePreview = '';

      if (conversation) {
        // Count unread messages sent by the OTHER user
        unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: u._id,
          seen: false
        });

        // Get last message
        const lastMsg = await Message.findOne({ conversationId: conversation._id })
          .sort({ createdAt: -1 });
        
        if (lastMsg) {
          lastMessagePreview = lastMsg.text;
        }
      }

      return {
        ...u,
        unreadCount,
        lastMessagePreview
      };
    }));

    res.status(200).json(enrichedUsers);
  } catch (error) {
    console.error('Error in getUsersForSidebar:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
