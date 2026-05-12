import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  image: {
    type: String, // URL to uploaded image
    default: null,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  replyToSnapshot: {
    text: String,
    senderName: String,
    image: String,
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
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
