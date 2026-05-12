import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Store to track rate limit attempts (in production, use Redis)
const loginAttempts = new Map();

const createLimiter = (windowMs, max, name) => {
  return rateLimit({
    windowMs,
    max,
    message: `Too many ${name} attempts, please try again later`,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${name} from ${req.ip}`);
      res.status(429).json({
        message: `Too many ${name} attempts, please try again later`,
        retryAfter: req.rateLimit?.resetTime,
      });
    },
  });
};

// Strict limit for login (5 attempts per 15 minutes)
export const loginLimiter = createLimiter(15 * 60 * 1000, 5, 'login');

// Strict limit for registration (3 per hour per IP)
export const registerLimiter = createLimiter(60 * 60 * 1000, 3, 'registration');

// General API rate limit (100 per 15 minutes)
export const apiLimiter = createLimiter(15 * 60 * 1000, 100, 'API requests');

// More lenient for messages (1000 per hour)
export const messageLimiter = createLimiter(60 * 60 * 1000, 1000, 'messages');

export default {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  messageLimiter,
};
