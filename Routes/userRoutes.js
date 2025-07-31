import express from 'express';
import { registerUser, verifyOtp, loginUser, resendOtp, getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import your auth middleware

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.post('/resend-otp', resendOtp);

// New route for getting all users, protected by authentication
router.get('/all-users', protect, getAllUsers);

export default router;