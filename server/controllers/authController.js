import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema, validateInput } from '../utils/validation.js';
import logger from '../utils/logger.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const validation = validateInput(registerSchema, { name, email, password });
    if (!validation.success) {
      logger.warn(`Registration validation failed for email: ${email}`, validation.errors);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: validation.data.email });
    if (userExists) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password with stronger salt rounds
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validation.data.password, salt);

    const user = await User.create({
      name: validation.data.name,
      email: validation.data.email,
      password: hashedPassword,
    });

    if (user) {
      logger.info(`User registered successfully: ${user.email}`);
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    }

    return res.status(400).json({ message: 'Failed to create user' });
  } catch (error) {
    logger.error('Error in registerUser:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateInput(loginSchema, { email, password });
    if (!validation.success) {
      logger.warn(`Login validation failed for email: ${email}`);
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    const user = await User.findOne({ email: validation.data.email });

    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      // Don't reveal whether email exists (security best practice)
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(validation.data.password, user.password);

    if (!isMatch) {
      logger.warn(`Failed login attempt for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Mark as online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    logger.error('Error in loginUser:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    if (req.user) {
      req.user.isOnline = false;
      req.user.lastSeen = new Date();
      await req.user.save();
      logger.info(`User logged out: ${req.user.email}`);
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error in logoutUser:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

