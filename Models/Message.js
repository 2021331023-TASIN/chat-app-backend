// models/Message.js
const mongoose = require('mongoose');

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
module.exports = Message;