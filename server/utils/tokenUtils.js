import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d'; // 7 days

// Generate access token
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
};

// Generate refresh token
export const generateRefreshToken = async (userId, userAgent, ipAddress) => {
  try {
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Generate random token
    const token = jwt.sign(
      { id: userId, type: 'refresh' },
      JWT_SECRET + Math.random().toString(36), // Add randomness
      {
        expiresIn: REFRESH_TOKEN_EXPIRATION,
      }
    );

    // Save to database
    const refreshToken = new RefreshToken({
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    });

    await refreshToken.save();
    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw error;
  }
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

// Verify and refresh token pair
export const verifyRefreshToken = async (token) => {
  try {
    // Decode without verification first
    const decoded = jwt.decode(token);

    // Verify signature
    jwt.verify(token, JWT_SECRET);

    // Check if token exists in database and is valid
    const refreshToken = await RefreshToken.findValidToken(token);

    if (!refreshToken) {
      throw new Error('Refresh token not found or revoked');
    }

    return { decoded, refreshToken };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    throw error;
  }
};

// Rotate refresh token (revoke old, generate new)
export const rotateRefreshToken = async (userId, oldToken, userAgent, ipAddress) => {
  try {
    const newToken = await generateRefreshToken(userId, userAgent, ipAddress);

    // Revoke old token and all others except the new one
    const oldRefreshToken = await RefreshToken.findOne({ token: oldToken });
    if (oldRefreshToken) {
      oldRefreshToken.replacedByToken = newToken;
      await oldRefreshToken.revoke();
    }

    return newToken;
  } catch (error) {
    console.error('Error rotating refresh token:', error);
    throw error;
  }
};

// Revoke all user tokens (logout all devices)
export const revokeAllUserTokens = async (userId) => {
  try {
    return await RefreshToken.revokeUserTokens(userId);
  } catch (error) {
    console.error('Error revoking user tokens:', error);
    throw error;
  }
};

// Revoke specific refresh token
export const revokeRefreshToken = async (token) => {
  try {
    const refreshToken = await RefreshToken.findOne({ token });
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    await refreshToken.revoke();
    return true;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    throw error;
  }
};

// Generate both tokens
export const generateTokenPair = async (userId, userAgent, ipAddress) => {
  try {
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId, userAgent, ipAddress);

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(JWT_EXPIRATION) || 900, // Default 15 minutes in seconds
    };
  } catch (error) {
    console.error('Error generating token pair:', error);
    throw error;
  }
};

// Clean up expired tokens (cleanup job)
export const cleanupExpiredTokens = async () => {
  try {
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    console.log(`Cleaned up ${result.deletedCount} expired refresh tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};
