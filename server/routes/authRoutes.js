import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', protect, logoutUser);

export default router;

