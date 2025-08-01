import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername: {
        type: String,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverUsername: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
}, {
    timestamps: true, // This adds createdAt and updatedAt fields, which we use for sorting
});

const Message = mongoose.model('Message', messageSchema);

export default Message;