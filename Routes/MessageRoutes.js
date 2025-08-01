import express from 'express';
import { getMessages, sendMessage } from '../Controllers/userController.js';
import protectRoute from '../middleware/protectRoute.js';

const router = express.Router();

// Get message history for a specific chat
router.get('/:otherUserId', protectRoute, getMessages);

// Send a new message
router.post('/send/:otherUserId', protectRoute, sendMessage);

export default router;