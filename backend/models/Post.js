// backend/models/Post.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define schema for likes (Post likes)
const likeSchema = new Schema({
    username: {
        type: String,
        required: true
    }
}, { _id: false, timestamps: { createdAt: true, updatedAt: false } });


const postSchema = new Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true,
        maxLength: 280
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '24h' // TTL index
    },
    likes: [likeSchema],
    commentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Post Virtuals
postSchema.virtual('likeCount').get(function () { return this.likes.length; });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;