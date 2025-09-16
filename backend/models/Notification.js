// backend/models/Notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    recipientUsername: { type: String, required: true, index: true },
    senderUsername: { type: String, required: true },
    type: { type: String, required: true, enum: ['like', 'comment', 'reply'] }, // Added 'reply' type
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    postTextSnippet: { type: String, required: false, maxLength: 50 },
    commentTextSnippet: { type: String, required: false, maxLength: 50 },
    // *** NEW: Store parent comment ID for replies ***
    parentCommentId: {
        type: Schema.Types.ObjectId,
        default: null // Null if it's a direct comment or like
    },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false // We manage createdAt manually
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;