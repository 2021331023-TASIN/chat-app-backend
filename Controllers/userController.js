import User from '../Models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../Utils/sendEmails.js'; // <-- Added the 's' here
import dotenv from 'dotenv';

dotenv.config();

// Helper to generate OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            // If user exists but is not verified, allow re-registration to send new OTP
            if (!user.isVerified) {
                user.password = await bcrypt.hash(password, 10);
                user.otp = generateOtp();
                user.otpExpires = Date.now() + 3600000; // OTP valid for 1 hour
                await user.save();

                await sendOtpEmail(email, user.otp);
                return res.status(400).json({ message: 'User already registered but not verified. A new OTP has been sent to your email.' });
            }
            return res.status(400).json({ message: 'User already registered and verified.' });
        }

        // Create new user
        user = new User({ username, email, password });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Generate and save OTP
        user.otp = generateOtp();
        user.otpExpires = Date.now() + 3600000; // OTP valid for 1 hour

        await user.save();

        // Send OTP email
        await sendOtpEmail(user.email, user.otp);

        res.status(201).json({ message: 'User registered successfully. OTP sent to your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        user.isVerified = true;
        user.otp = undefined; // Clear OTP after verification
        user.otpExpires = undefined; // Clear OTP expiration
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Email verified successfully. You are now logged in.',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error.message);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials. User not found.' });
        }

        if (!user.isVerified) {
            // Re-send OTP if user tries to log in without verification
            user.otp = generateOtp();
            user.otpExpires = Date.now() + 3600000; // OTP valid for 1 hour
            await user.save();
            await sendOtpEmail(email, user.otp);

            return res.status(403).json({ message: 'Please verify your email address. A new OTP has been sent.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Logged in successfully.',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
export const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified. Please proceed to login.' });
        }

        // Generate new OTP
        user.otp = generateOtp();
        user.otpExpires = Date.now() + 3600000; // OTP valid for 1 hour
        await user.save();

        // Send new OTP email
        await sendOtpEmail(user.email, user.otp);

        res.status(200).json({ message: 'New OTP sent to your email.' });

    } catch (error) {
        console.error('Resend OTP error:', error.message);
        res.status(500).json({ message: 'Server error during OTP resend.' });
    }
};


// @desc    Get all registered users (for chat list)
// @route   GET /api/users/all-users
// @access  Private (requires token)
export const getAllUsers = async (req, res) => {
    try {
        // req.user.id is set by the protect middleware based on JWT
        const currentUserId = req.user.id;

        // Fetch all users *except* the current authenticated user
        // and only include verified users for chat
        const users = await User.find({ _id: { $ne: currentUserId }, isVerified: true })
            .select('-password -otp -otpExpires -isVerified -createdAt -updatedAt'); // Exclude sensitive/unnecessary fields

        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching all users:", error.message);
        res.status(500).json({ message: "Server error fetching users." });
    }
};