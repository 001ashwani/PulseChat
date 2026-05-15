import express from 'express';
import { getUsersForSidebar, getLastSeenTimestamp, getUserContacts } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUsersForSidebar);
router.get('/contacts', protect, getUserContacts);
router.get('/:id/last-seen', protect, getLastSeenTimestamp);

export default router;
