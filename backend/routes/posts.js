const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// --- Helper Function to Create Notification ---
async function createNotification(recipient, sender, type, post, commentText = null, parentCommentId = null) {
    if (recipient === sender) { return; } // No self-notifications
    try {
        const notificationData = {
            recipientUsername: recipient,
            senderUsername: sender,
            type: type, // 'like', 'comment', or 'reply'
            postId: post._id,
            postTextSnippet: post.text.substring(0, 50) + (post.text.length > 50 ? '...' : ''),
            isRead: false,
            createdAt: new Date(),
            parentCommentId: parentCommentId // Include parent ID if it's a reply notification
        };
        // Add comment snippet only for comment/reply types
        if ((type === 'comment' || type === 'reply') && commentText) {
            notificationData.commentTextSnippet = commentText.substring(0, 50) + (commentText.length > 50 ? '...' : '');
        }
        const newNotification = new Notification(notificationData);
        await newNotification.save();
        console.log(`Notification created for ${recipient} about post ${post._id} (Type: ${type}${parentCommentId ? `, Parent: ${parentCommentId}` : ''})`);
    } catch (error) {
        console.error(`Error creating notification for post ${post._id}:`, error);
    }
}

// Create Post (Protected)
router.post('/posts', auth, async (req, res) => {
    const { text } = req.body;
    const username = req.user.username; // From Token

    if (!text) { return res.status(400).json({ message: 'Text is required.' }); }
    try {
        const newPost = new Post({ username: username, text: text });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost.toJSON());
    } catch (error) {
        console.error("Error saving post:", error);
        if (error.name === 'ValidationError') { return res.status(400).json({ message: 'Validation failed', error: error.message }); }
        res.status(500).json({ message: 'Server error creating post', error: error.message });
    }
});

// Get All Posts (Public)
router.get('/posts', async (req, res) => {
    const sortBy = req.query.sort || 'latest';
    const limit = 50;
    try {
        let posts;
        if (sortBy === 'popular') {
            const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(200);
            posts = recentPosts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
            posts = posts.slice(0, limit);
        } else {
            posts = await Post.find().sort({ createdAt: -1 }).limit(limit);
        }
        res.status(200).json(posts.map(p => p.toJSON()));
    } catch (error) {
        console.error(`Error fetching posts (sorted by ${sortBy}):`, error);
        res.status(500).json({ message: 'Server error fetching posts', error: error.message });
    }
});

// Get My Posts (Protected)
router.get('/my-posts', auth, async (req, res) => {
    const username = req.user.username; // From Token
    try {
        const userPosts = await Post.find({ username: username }).sort({ createdAt: -1 }).limit(100);
        res.status(200).json(userPosts.map(p => p.toJSON()));
    } catch (error) {
        console.error(`Error fetching posts for user ${username}:`, error);
        res.status(500).json({ message: 'Server error fetching user posts', error: error.message });
    }
});

// Get Single Post (Public)
router.get('/:postId', async (req, res) => {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); }
    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }

        // Fetch comments separate collection
        const comments = await Comment.find({ postId: postId }).sort({ createdAt: 1 });

        const postObj = post.toJSON();
        postObj.comments = comments.map(c => c.toJSON()); // Attach comments to the response object manually

        res.status(200).json(postObj);
    } catch (error) {
        console.error(`Error fetching single post ${postId}:`, error);
        res.status(500).json({ message: 'Server error fetching post details', error: error.message });
    }
});

// Like Post (Protected)
router.post('/:postId/like', auth, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username; // From Token

    if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); }
    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }
        const alreadyLiked = post.likes.some(like => like.username === username);
        if (alreadyLiked) { return res.status(200).json(post.toJSON()); }

        post.likes.push({ username: username });
        const updatedPost = await post.save();
        await createNotification(updatedPost.username, username, 'like', updatedPost);
        res.status(200).json(updatedPost.toJSON());
    } catch (error) {
        console.error(`Error liking post ${postId}:`, error);
        res.status(500).json({ message: 'Server error liking post', error: error.message });
    }
});

// Add Comment (Protected)
router.post('/:postId/comments', auth, async (req, res) => {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const username = req.user.username; // From Token

    if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); }
    if (!text) { return res.status(400).json({ message: 'Comment text is required.' }); }
    if (text.length > 500) { return res.status(400).json({ message: 'Comment text cannot exceed 500 characters.' }); }
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) { return res.status(400).json({ message: 'Invalid Parent Comment ID format.' }); }

    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }

        let parentComment = null;
        if (parentId) {
            parentComment = await Comment.findById(parentId);
            if (!parentComment || parentComment.postId.toString() !== postId) {
                return res.status(400).json({ message: 'Parent comment not found in this post.' });
            }
        }

        const newComment = new Comment({
            postId: postId,
            username: username,
            text: text,
            parentId: parentId || null
        });

        await newComment.save();

        // Increment comment count on Post
        post.commentCount += 1;
        await post.save();

        // --- Notification Logic ---
        const postOwner = post.username;
        const notificationType = parentId ? 'reply' : 'comment';
        await createNotification(postOwner, username, notificationType, post, text, parentId);
        if (parentId && parentComment) {
            const parentAuthor = parentComment.username;
            if (parentAuthor !== postOwner && parentAuthor !== username) {
                await createNotification(parentAuthor, username, 'reply', post, text, parentId);
            }
        }
        // --- End Notification Logic ---

        res.status(201).json(post.toJSON());
    } catch (error) {
        console.error(`Error adding comment/reply to post ${postId}:`, error);
        if (error.name === 'ValidationError') { return res.status(400).json({ message: 'Validation failed', error: error.message }); }
        res.status(500).json({ message: 'Server error adding comment', error: error.message });
    }
});

// Delete Comment (Protected)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
    const { postId, commentId } = req.params;
    const username = req.user.username; // From Token

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) { return res.status(400).json({ message: 'Invalid Post or Comment ID format.' }); }

    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }

        const comment = await Comment.findById(commentId);
        if (!comment) { return res.status(404).json({ message: 'Comment not found.' }); }

        if (post.username !== username && comment.username !== username) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment.' });
        }

        await Comment.deleteOne({ _id: commentId });

        // Decrement comment count
        post.commentCount = Math.max(0, post.commentCount - 1);
        await post.save();

        await Comment.deleteMany({ parentId: commentId });

        res.status(200).json(post.toJSON());
    } catch (error) {
        console.error(`Error deleting comment ${commentId} from post ${postId}:`, error);
        res.status(500).json({ message: 'Server error deleting comment', error: error.message });
    }
});

// Upvote Comment (Protected)
router.post('/:postId/comments/:commentId/upvote', auth, async (req, res) => {
    const { postId, commentId } = req.params;
    const username = req.user.username; // From Token

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) { return res.status(400).json({ message: 'Invalid Post or Comment ID format.' }); }

    try {
        const comment = await Comment.findById(commentId);
        if (!comment) { return res.status(404).json({ message: 'Comment not found.' }); }
        if (comment.postId.toString() !== postId) { return res.status(400).json({ message: 'Comment does not belong to this post.' }); }

        const upvoteIndex = comment.upvotes.indexOf(username);
        if (upvoteIndex === -1) {
            comment.upvotes.push(username);
        } else {
            comment.upvotes.splice(upvoteIndex, 1);
        }
        await comment.save();

        res.status(200).json({ postId: postId, commentId: comment._id, upvotes: comment.upvotes, upvoteCount: comment.upvotes.length });
    } catch (error) {
        console.error(`Error upvoting comment ${commentId} on post ${postId}:`, error);
        res.status(500).json({ message: 'Server error upvoting comment', error: error.message });
    }
});

// Delete Post (Protected)
router.delete('/:postId', auth, async (req, res) => {
    const { postId } = req.params;
    const username = req.user.username; // From Token

    if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); }

    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }

        if (post.username !== username) {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await Post.findByIdAndDelete(postId);

        try {
            await Comment.deleteMany({ postId: postId });
        } catch (commentError) { console.error('Error deleting associated comments:', commentError); }

        try {
            await Notification.deleteMany({ postId: postId });
        } catch (notifError) { console.error(`Error deleting associated notifications:`, notifError); }

        res.status(200).json({ message: 'Post deleted successfully.', deletedPostId: postId });
    } catch (error) {
        console.error(`Error deleting post ${postId}:`, error);
        res.status(500).json({ message: 'Server error deleting post', error: error.message });
    }
});

module.exports = router;
