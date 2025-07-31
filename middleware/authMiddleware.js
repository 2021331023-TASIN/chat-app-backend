// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../Models/User.js'; // Adjust path if necessary based on your folder structure

export const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using your JWT secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by ID from the decoded token payload
            // and attach the user object (without password) to the request
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            // If token is invalid or expired
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token is provided in the header
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};