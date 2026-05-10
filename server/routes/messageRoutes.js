import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send/:id', protect, sendMessage);
router.get('/:id', protect, getMessages);

export default router;
