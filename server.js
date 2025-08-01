import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './Routes/userRoutes.js';
import messageRoutes from './Routes/MessageRoutes.js'; // New import
import { app, httpServer } from './socket/socket.js'; // Import from new socket file

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chat-app-frontend-sigma-eight.vercel.app';

// Middleware
app.use(express.json());
app.use(cors({
    origin: FRONTEND_URL,
}));

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

// Your routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes); // <--- Add this line

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🌐 Server listening on port ${PORT}`);
    });
});