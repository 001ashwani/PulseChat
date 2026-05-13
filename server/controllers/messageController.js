import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Send a message
// @route   POST /api/messages/send/:id
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text, replyToId, image } = req.body;
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

    // Build replyToSnapshot if replying
    let replyToSnapshot = null;
    if (replyToId) {
      const original = await Message.findById(replyToId).populate('senderId', 'name');
      if (original) {
        replyToSnapshot = {
          text: original.text,
          senderName: original.senderId?.name || 'Unknown',
          image: original.image,
        };
      }
    }

    const newMessage = new Message({
      senderId,
      conversationId: conversation._id,
      text: text || '',
      image: image || null,
      replyTo: replyToId || null,
      replyToSnapshot,
    });

    await newMessage.save();

    // Update conversation lastMessage
    conversation.lastMessage = newMessage._id;
    await conversation.save();

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

    // Mark all unread messages from the OTHER user as delivered/read
    await Message.updateMany(
      { conversationId: conversation._id, senderId: userToChatId, status: 'sent' },
      { $set: { status: 'delivered', deliveredAt: new Date(), seen: true } }
    );

    // Also mark as read if we're actively viewing
    await Message.updateMany(
      { conversationId: conversation._id, senderId: userToChatId, status: 'delivered' },
      { $set: { status: 'read', readAt: new Date(), seen: true } }
    );

    const messages = await Message.find({
      conversationId: conversation._id,
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: senderId },
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (deleteForEveryone) {
      // Only sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      message.deletedForEveryone = true;
      message.text = '';
      message.image = null;
    } else {
      // Delete just for this user
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();
    res.status(200).json({ success: true, messageId, deleteForEveryone });
  } catch (error) {
    console.error('Error in deleteMessage:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    React to a message
// @route   POST /api/messages/:id/react
// @access  Private
export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());

    // Add new reaction (if not toggling off same emoji)
    const existing = message.reactions.find(r => r.userId.toString() === userId.toString() && r.emoji === emoji);
    if (!existing) {
      message.reactions.push({ emoji, userId });
    }

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.error('Error in reactToMessage:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send a message to a group
// @route   POST /api/messages/group/:groupId
// @access  Private
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, replyToId, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    // Find conversation for this group
    let conversation = await Conversation.findOne({ groupId });
    if (!conversation) {
      return res.status(404).json({ message: 'Group conversation not found' });
    }

    // Verify user is in group
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    // Build replyToSnapshot if replying
    let replyToSnapshot = null;
    if (replyToId) {
      const original = await Message.findById(replyToId).populate('senderId', 'name');
      if (original) {
        replyToSnapshot = {
          text: original.text,
          senderName: original.senderId?.name || 'Unknown',
          image: original.image,
        };
      }
    }

    const newMessage = new Message({
      senderId,
      conversationId: conversation._id,
      text: text || '',
      image: image || null,
      replyTo: replyToId || null,
      replyToSnapshot,
    });

    await newMessage.save();

    // Update conversation lastMessage
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Populate sender details
    const populated = await newMessage.populate('senderId', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error in sendGroupMessage:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for a group conversation
// @route   GET /api/messages/group/:groupId
// @access  Private
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({ groupId });
    if (!conversation) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is in group
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: userId },
    }).populate('senderId', 'name email avatar').sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getGroupMessages:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
