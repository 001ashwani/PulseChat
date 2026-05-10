import express from 'express';
import { getUsersForSidebar } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getUsersForSidebar);

export default router;
