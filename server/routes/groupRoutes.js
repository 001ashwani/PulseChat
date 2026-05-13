import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createGroup,
  getGroup,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  deleteGroup,
} from '../controllers/groupController.js';

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/:id', protect, getGroup);
router.patch('/:id', protect, updateGroup);
router.post('/:id/members', protect, addMembers);
router.delete('/:id/members/:userId', protect, removeMember);
router.post('/:id/leave', protect, leaveGroup);
router.delete('/:id', protect, deleteGroup);

export default router;
