import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderUsername: {
        type: String,
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverUsername: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // This is the critical line
});

const Message = mongoose.model('Message', messageSchema);
export default Message;