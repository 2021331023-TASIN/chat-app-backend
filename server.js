import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './Routes/userRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io'; // Import Server from socket.io
import http from 'http'; // Import http module

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
});

// Create an HTTP server from the Express app
const httpServer = http.createServer(app);

// Initialize Socket.IO with the HTTP server
// const io = new Server(httpServer, {
//     cors: {
//         origin: "http://localhost:3000", // Allow your frontend to connect
//         methods: ["GET", "POST"]
//     }
// });
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL, // <-- Changed to use environment variable
        methods: ["GET", "POST"]
    }
});

// --- Socket.IO connection handling ---
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // You can associate socket ID with user ID here if you send it from the frontend
    // e.g., socket.on('userOnline', (userId) => { socket.userId = userId; /* store socket.id -> userId mapping */ });
    // For simplicity, we are not storing real-time user-socket mappings in this basic example
    // but just logging.

    socket.on('userOnline', (userId) => {
        console.log(`User ${userId} is online. Socket ID: ${socket.id}`);
        // In a more advanced app, you'd store this for direct messaging
        // e.g., activeUsers[userId] = socket.id;
    });

    // Listen for 'sendMessage' event from the client
    socket.on('sendMessage', (messageData) => {
        console.log('Received message:', messageData);
        // In a real app, you'd save this message to a database,
        // then find the recipient's socket ID and emit directly to them.
        // For now, we'll emit to all connected clients.
        // For direct messages (if you had socket.userId mapping):
        // const recipientSocketId = activeUsers[messageData.receiverId];
        // if (recipientSocketId) {
        //    io.to(recipientSocketId).emit('receiveMessage', messageData);
        // }
        // io.to(socket.id).emit('receiveMessage', messageData); // Echo back to sender

        // For now, broadcast to all for simplicity in this basic chat example:
        io.emit('receiveMessage', messageData);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // If you stored user-socket mappings, you'd remove them here
        // e.g., delete activeUsers[socket.userId];
    });
});
// --- End Socket.IO connection handling ---

// API routes
app.use('/api/users', userRoutes);


// Start server (now using httpServer for both Express and Socket.IO)
httpServer.listen(PORT, () => {
    console.log(`🌐 Server listening on http://localhost:${PORT}`);
});