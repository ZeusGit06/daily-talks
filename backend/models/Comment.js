const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        maxLength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    upvotes: {
        type: [String], // Array of usernames
        default: []
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    }
}, {
    timestamps: true, // Use automatic timestamps (createdAt, updatedAt)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

commentSchema.virtual('upvoteCount').get(function () {
    return this.upvotes.length;
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
