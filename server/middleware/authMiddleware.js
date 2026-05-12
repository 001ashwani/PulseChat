import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET not configured');
        return res.status(500).json({ message: 'Server configuration error' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        logger.warn(`User not found for token: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Token expired');
        return res.status(401).json({ message: 'Token expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid token');
        return res.status(401).json({ message: 'Invalid token' });
      }
      logger.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    logger.warn('No authorization token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};