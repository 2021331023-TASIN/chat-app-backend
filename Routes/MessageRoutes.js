import express from 'express';
import { getMessages, sendMessage } from '../Controllers/userController.js';
// Correct import statement:
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get message history for a specific chat
router.get('/:otherUserId', protect, getMessages);

// Send a new message
router.post('/send/:otherUserId', protect, sendMessage);

export default router;