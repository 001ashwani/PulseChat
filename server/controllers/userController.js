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

// @desc    Get last seen timestamp for a user
// @route   GET /api/users/:id/last-seen
// @access  Private
export const getLastSeenTimestamp = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('lastSeen isOnline');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      userId: user._id,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline
    });
  } catch (error) {
    console.error('Error in getLastSeenTimestamp:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all contacts with their status
// @route   GET /api/users/contacts
// @access  Private
export const getUserContacts = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { search = '', sort = 'recent' } = req.query;

    // Build search query
    const searchQuery = search
      ? { email: { $regex: search, $options: 'i' }, name: { $regex: search, $options: 'i' } }
      : {};

    let contacts = await User.find({
      _id: { $ne: currentUserId },
      ...searchQuery
    })
      .select('_id name email lastSeen isOnline avatar')
      .lean();

    // Helper function to check if user is online (active within last 5 minutes)
    const isUserOnline = (lastSeen) => {
      const now = new Date();
      const diff = now - new Date(lastSeen);
      return diff < 5 * 60 * 1000; // 5 minutes
    };

    // Enrich with online status
    contacts = contacts.map(c => ({
      ...c,
      isOnline: isUserOnline(c.lastSeen),
      displayStatus: isUserOnline(c.lastSeen) ? 'online' : `Last seen at ${new Date(c.lastSeen).toLocaleTimeString()}`
    }));

    // Sort by option
    if (sort === 'recent') {
      contacts.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    } else if (sort === 'online') {
      contacts.sort((a, b) => b.isOnline - a.isOnline);
    } else if (sort === 'alpha') {
      contacts.sort((a, b) => a.email.localeCompare(b.email));
    }

    res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error in getUserContacts:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
