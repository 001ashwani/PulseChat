import User from '../models/User.js';

// @desc    Get users for sidebar
// @route   GET /api/users
// @access  Private
export const getUsersForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch all users except the current user, exclude passwords
    const users = await User.find({ _id: { $ne: currentUserId } }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error in getUsersForSidebar:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
