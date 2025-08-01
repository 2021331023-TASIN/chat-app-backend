import express from 'express';
// Make sure to add 'getMessages' to the import list
import { registerUser, verifyOtp, loginUser, resendOtp, getAllUsers, getMessages } from '../Controllers/userController.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/resend-otp', resendOtp);

// New route for getting all users, protected by authentication
router.get('/all-users', protect, getAllUsers);

// NEW ROUTE: Fetch all messages for a specific chat, protected by auth
router.get('/messages/:otherUserId', protect, getMessages);

export default router;