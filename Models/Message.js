// models/Message.js
import mongoose from 'mongoose'; // Correct import syntax

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
    },
    { timestamps: true } // This ensures createdAt and updatedAt fields are added automatically
);

const Message = mongoose.model('Message', messageSchema);

export default Message; // Correct export syntax