import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './Routes/userRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import Message from './Models/Message.js';
import User from './Models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_URL,
        methods: ["GET", "POST"]
    }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    socket.on('userOnline', (userId) => {
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} is now online. Socket ID: ${socket.id}`);
    });

    socket.on('sendMessage', async (messageData) => {
        try {
            console.log('Received message to send:', messageData);

            const sender = await User.findById(messageData.senderId);
            const receiver = await User.findById(messageData.receiverId);

            if (!sender || !receiver) {
                console.error('Sender or receiver not found.');
                return;
            }

            const newMessage = await Message.create({
                senderId: messageData.senderId,
                senderUsername: sender.username,
                receiverId: messageData.receiverId,
                receiverUsername: receiver.username,
                text: messageData.text,
            });

            const receiverSocketId = onlineUsers.get(messageData.receiverId);

            const fullMessage = {
                _id: newMessage._id,
                senderId: newMessage.senderId,
                senderUsername: newMessage.senderUsername,
                receiverId: newMessage.receiverId,
                text: newMessage.text,
                timestamp: newMessage.createdAt,
            };

            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', fullMessage);
            }

            const senderSocketId = onlineUsers.get(messageData.senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveMessage', fullMessage);
            }
        } catch (error) {
            console.error('Error handling sendMessage:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (let [key, value] of onlineUsers.entries()) {
            if (value === socket.id) {
                onlineUsers.delete(key);
                console.log(`User ${key} is now offline.`);
                break;
            }
        }
    });

    socket.on('userOffline', (userId) => {
        onlineUsers.delete(userId);
        console.log(`User ${userId} is now offline.`);
    });
});

app.use('/api/users', userRoutes);

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🌐 Server listening on port ${PORT}`);
    });
});