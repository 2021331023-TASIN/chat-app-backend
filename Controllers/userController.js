import User from '../Models/User.js';
import Message from '../Models/Message.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { sendOtpEmail } from '../utils/sendEmails.js';
import { io } from '../socket/socket.js'; // Import io from the new socket setup

// Controller to handle user registration
const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
        const otpExpires = Date.now() + 3600000; // OTP expires in 1 hour

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            otp,
            otpExpires
        });

        await newUser.save();
        await sendOtpEmail(newUser.email, otp);

        res.status(201).json({ message: 'User registered successfully. Please check your email for OTP.' });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Controller to verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified.' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.isVerified = true;
        user.otp = undefined; // Clear OTP after successful verification
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};

// Controller to resend OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified.' });
        }

        const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
        user.otp = otp;
        user.otpExpires = Date.now() + 3600000; // New OTP expires in 1 hour
        await user.save();

        await sendOtpEmail(user.email, otp);

        res.status(200).json({ message: 'New OTP sent to your email.' });
    } catch (error) {
        console.error('Error in resendOtp:', error);
        res.status(500).json({ message: 'Failed to resend OTP.' });
    }
};

// Controller to handle user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Invalid credentials.' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email with OTP first.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// Controller to get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }).select('-password -otp -otpExpires -isVerified');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Controller to get messages for a specific chat
const getMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const currentUserId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId },
            ],
        }).sort({ createdAt: 1 });
        
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Controller to send a new message
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { otherUserId } = req.params;
        const senderId = req.user.id;
        const senderUsername = req.user.username;

        const newMessage = new Message({
            senderId,
            senderUsername,
            receiverId: otherUserId,
            receiverUsername: await User.findById(otherUserId).select('username'),
            text: message,
        });

        await newMessage.save();

        // Get the recipient's socket ID from the onlineUsers map
        const receiverSocketId = onlineUsers.get(otherUserId);
        if (receiverSocketId) {
            // Emit the new message to the recipient in real-time
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

export { registerUser, verifyOtp, loginUser, resendOtp, getAllUsers, getMessages, sendMessage };