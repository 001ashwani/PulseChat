import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Content: plain text (up to 65,536 chars)
  content: {
    type: String,
    default: '',
    maxlength: 65536,
  },
  // Formatted content (markdown rendered to HTML for display)
  formattedContent: {
    type: String,
    default: '',
  },
  // Legacy field for backward compatibility
  text: {
    type: String,
    default: '',
  },
  // Image attachment
  image: {
    type: String,
    default: null,
  },
  // Message status: 'sent', 'delivered', 'read'
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  readAt: {
    type: Date,
    default: null,
  },
  // Legacy field (kept for backward compat, use status instead)
  seen: {
    type: Boolean,
    default: false,
  },
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
    index: true,
  },
  replyToSnapshot: {
    text: String,
    senderName: String,
    image: String,
  },
  // Forwarded message indicator
  forwardedFrom: {
    type: String, // Shows original sender info
    default: null,
  },
  // Emoji reactions
  reactions: {
    type: [reactionSchema],
    default: [],
  },
  // Deletion tracking
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  // Edit tracking
  editedAt: {
    type: Date,
    default: null,
  },
  editHistory: [{
    content: String,
    editedAt: Date,
  }],
  // Soft delete timestamp
  deletedAt: {
    type: Date,
    default: null,
  },
}, { 
  timestamps: true,
  indexes: [
    { conversationId: 1, createdAt: -1 },
    { senderId: 1, createdAt: -1 },
    { status: 1 },
  ],
});

// Instance methods
messageSchema.methods.isEditable = function() {
  if (this.deletedForEveryone) return false;
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.createdAt > fifteenMinutesAgo;
};

messageSchema.methods.isDeletableForEveryone = function() {
  if (this.deletedForEveryone) return false;
  const sixtyHoursAgo = new Date(Date.now() - 60 * 60 * 60 * 1000);
  return this.createdAt > sixtyHoursAgo;
};

messageSchema.methods.addReaction = async function(emoji, userId) {
  const existingReaction = this.reactions.find(
    r => r.emoji === emoji && r.userId.toString() === userId.toString()
  );
  
  if (!existingReaction) {
    this.reactions.push({ emoji, userId, createdAt: new Date() });
    await this.save();
  }
  
  return this;
};

messageSchema.methods.removeReaction = async function(emoji, userId) {
  this.reactions = this.reactions.filter(
    r => !(r.emoji === emoji && r.userId.toString() === userId.toString())
  );
  await this.save();
  return this;
};

messageSchema.methods.markAsDelivered = async function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    await this.save();
  }
  return this;
};

messageSchema.methods.markAsRead = async function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.readAt = new Date();
    this.seen = true; // backward compat
    await this.save();
  }
  return this;
};

const Message = mongoose.model('Message', messageSchema);
export default Message;
