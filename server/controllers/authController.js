import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { generateTokenPair, verifyRefreshToken, rotateRefreshToken, revokeAllUserTokens } from '../utils/tokenUtils.js';
import RefreshToken from '../models/RefreshToken.js';
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
      
      // Generate token pair
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const { accessToken, refreshToken } = await generateTokenPair(user._id, userAgent, ipAddress);
      
      return res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
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

    // Generate token pair
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const { accessToken, refreshToken } = await generateTokenPair(user._id, userAgent, ipAddress);

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
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

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token request without token');
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const { decoded } = await verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn(`Refresh token for non-existent user: ${decoded.id}`);
      return res.status(401).json({ error: 'User not found' });
    }

    // Rotate refresh token
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const newRefreshToken = await rotateRefreshToken(user._id, refreshToken, userAgent, ipAddress);
    const newAccessToken = generateToken(user._id);

    logger.info(`Token refreshed for user: ${user.email}`);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Error in refreshAccessToken:', error.message);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// @desc    Logout all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Revoke all refresh tokens
    await revokeAllUserTokens(req.user._id);

    // Mark user as offline
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();

    logger.info(`User logged out from all devices: ${req.user.email}`);

    return res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    logger.error('Error in logoutAllDevices:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get current user refresh tokens (devices)
// @route   GET /api/auth/devices
// @access  Private
export const getUserDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const devices = await RefreshToken.find({
      userId: req.user._id,
      revokedAt: null,
    }).select('userAgent ipAddress createdAt expiresAt');

    return res.json({ devices });
  } catch (error) {
    logger.error('Error in getUserDevices:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Revoke specific device
// @route   DELETE /api/auth/devices/:deviceId
// @access  Private
export const revokeDevice = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { deviceId } = req.params;

    const refreshToken = await RefreshToken.findById(deviceId);
    if (!refreshToken) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (refreshToken.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await refreshToken.revoke();

    logger.info(`Device revoked for user: ${req.user.email}`);

    return res.json({ message: 'Device revoked successfully' });
  } catch (error) {
    logger.error('Error in revokeDevice:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
