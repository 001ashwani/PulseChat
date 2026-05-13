import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true, // Add index for faster queries
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true, // Add index for sorting
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true, // Add index for filtering online users
  }
}, { timestamps: true });

// Ensure indexes are created
userSchema.index({ isOnline: 1, lastSeen: -1 });

const User = mongoose.model('User', userSchema);
export default User;

