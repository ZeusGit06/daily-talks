// backend/routes/api.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post.js');
const Notification = require('../models/Notification.js');
const Profile = require('../models/Profile.js');
const mongoose = require('mongoose');

console.log("--- Loading backend/routes/api.js ---");

// --- Helper Function to Create Notification ---
// *** MODIFIED: Added parentCommentId parameter ***
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

// === API Routes ===

// --- Profile Routes ---
router.post('/profiles', async (req, res) => { /* ... no changes ... */ console.log("Received POST /api/profiles request body:", req.body); const { username, isPublic } = req.body; if (!username) { return res.status(400).json({ message: 'Username is required.' }); } try { const existingProfile = await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }); if (existingProfile) { console.log(`Attempt to create profile failed: Username '${username}' already exists.`); return res.status(409).json({ message: 'Username already exists.', code: 'USERNAME_TAKEN' }); } const newProfileData = { username: username }; if (typeof isPublic === 'boolean') { newProfileData.isPublic = isPublic; } const profile = new Profile(newProfileData); const savedProfile = await profile.save(); console.log("Profile saved successfully:", savedProfile.username); res.status(201).json(savedProfile.toJSON()); } catch (error) { console.error("Error creating profile:", error); if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(e => e.message); return res.status(400).json({ message: 'Validation failed creating profile.', errors: messages }); } if (error.code === 11000) { return res.status(409).json({ message: 'Username already exists (concurrent creation).', code: 'USERNAME_TAKEN' }); } res.status(500).json({ message: 'Server error creating profile', error: error.message }); } });
router.get('/profiles/check-username', async (req, res) => { /* ... no changes ... */ const { username } = req.query; console.log(`Received GET /api/profiles/check-username?username=${username}`); if (!username) { return res.status(400).json({ message: 'Username query parameter is required.' }); } try { const existingProfile = await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }, '_id'); if (existingProfile) { console.log(`Username check: '${username}' exists.`); res.status(200).json({ exists: true }); } else { console.log(`Username check: '${username}' does not exist.`); res.status(200).json({ exists: false }); } } catch (error) { console.error(`Error checking username '${username}':`, error); res.status(500).json({ message: 'Server error checking username', error: error.message }); } });
router.get('/profiles/:username', async (req, res) => { /* ... no changes ... */ const requestedUsername = req.params.username; console.log(`>>> ROUTE MATCH: GET /profiles/${requestedUsername}`); try { const profile = await Profile.findOne( { username: { $regex: new RegExp(`^${requestedUsername}$`, 'i') } }, 'username isPublic createdAt' ); if (!profile) { return res.status(404).json({ message: 'Profile not found.' }); } console.log(`Found profile for ${requestedUsername}.`); res.status(200).json(profile.toJSON()); } catch (error) { console.error(`Error fetching profile for ${requestedUsername}:`, error); res.status(500).json({ message: 'Server error fetching profile', error: error.message }); } });
router.get('/profiles/:username/posts', async (req, res) => { /* ... no changes ... */ const requestedUsername = req.params.username; console.log(`>>> ROUTE MATCH: GET /profiles/${requestedUsername}/posts`); try { const profile = await Profile.findOne( { username: { $regex: new RegExp(`^${requestedUsername}$`, 'i') } }, 'username isPublic' ); if (!profile) { return res.status(404).json({ message: 'Profile not found.' }); } if (!profile.isPublic) { console.log(`Access denied: Profile ${requestedUsername} is private.`); return res.status(403).json({ message: 'This profile is private.' }); } const userPosts = await Post.find({ username: profile.username }).sort({ createdAt: -1 }).limit(100); console.log(`Found ${userPosts.length} posts for user ${profile.username} (public profile).`); res.status(200).json(userPosts.map(p => p.toJSON())); } catch (error) { console.error(`Error fetching posts for profile ${requestedUsername}:`, error); res.status(500).json({ message: 'Server error fetching profile posts', error: error.message }); } });
router.patch('/profiles/me/visibility', async (req, res) => { /* ... no changes ... */ const { username, isPublic } = req.body; console.log(`>>> ROUTE MATCH: PATCH /profiles/me/visibility for user ${username}`); if (!username || typeof isPublic !== 'boolean') { return res.status(400).json({ message: 'Username and isPublic (boolean) are required.' }); } try { const updatedProfile = await Profile.findOneAndUpdate( { username: username }, { $set: { isPublic: isPublic } }, { new: true, runValidators: true, select: 'username isPublic' } ); if (!updatedProfile) { return res.status(404).json({ message: 'Your profile not found.' }); } console.log(`Profile visibility updated for ${username} to ${isPublic}`); res.status(200).json(updatedProfile.toJSON()); } catch (error) { console.error(`Error updating visibility for user ${username}:`, error); res.status(500).json({ message: 'Server error updating profile visibility', error: error.message }); } });

// --- Post Routes ---
router.post('/posts', async (req, res) => { /* ... no changes ... */ console.log("Received POST /api/posts request body:", req.body); const { username, text } = req.body; if (!username || !text) { return res.status(400).json({ message: 'Username and text are required.' }); } try { const newPost = new Post({ username: username, text: text }); const savedPost = await newPost.save(); console.log("Post saved successfully:", savedPost._id); res.status(201).json(savedPost.toJSON()); } catch (error) { console.error("Error saving post:", error); if (error.name === 'ValidationError') { return res.status(400).json({ message: 'Validation failed', error: error.message }); } res.status(500).json({ message: 'Server error creating post', error: error.message }); } });
router.get('/posts', async (req, res) => { /* ... no changes ... */ const sortBy = req.query.sort || 'latest'; const limit = 50; console.log(`Received GET /api/posts request with sort: ${sortBy}`); let sortCriteria; try { let posts; if (sortBy === 'popular') { console.log("Sorting posts by popularity (likeCount)"); const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(200); posts = recentPosts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0)); posts = posts.slice(0, limit); } else { console.log("Sorting posts by latest (createdAt)"); sortCriteria = { createdAt: -1 }; posts = await Post.find().sort(sortCriteria).limit(limit); } console.log(`Found ${posts.length} posts for home feed (sorted by ${sortBy}).`); res.status(200).json(posts.map(p => p.toJSON())); } catch (error) { console.error(`Error fetching posts (sorted by ${sortBy}):`, error); res.status(500).json({ message: 'Server error fetching posts', error: error.message }); } });

// --- User-Specific Post Route (My Posts) ---
router.get('/my-posts', async (req, res) => { /* ... no changes ... */ const { username } = req.query; console.log(`>>> ROUTE MATCH: /my-posts for user: ${username}`); if (!username) { console.error("My Posts request missing username query parameter."); return res.status(400).json({ message: 'Username query parameter is required.' }); } try { const userPosts = await Post.find({ username: username }).sort({ createdAt: -1 }).limit(100); console.log(`Found ${userPosts.length} posts for user ${username}.`); res.status(200).json(userPosts.map(p => p.toJSON())); } catch (error) { console.error(`Error fetching posts for user ${username}:`, error); res.status(500).json({ message: 'Server error fetching user posts', error: error.message }); } });

// --- Notification Routes ---
router.get('/notifications', async (req, res) => { /* ... no changes ... */ const { username } = req.query; console.log(`>>> ROUTE MATCH: /notifications for user: ${username}`); if (!username) { return res.status(400).json({ message: 'Username query parameter is required.' }); } try { const notifications = await Notification.find({ recipientUsername: username }).sort({ createdAt: -1 }).limit(50); const notificationIds = notifications.filter(n => !n.isRead).map(n => n._id); if (notificationIds.length > 0) { console.log(`Attempting to mark ${notificationIds.length} notifications as read for user ${username}.`); try { const updateResult = await Notification.updateMany( { _id: { $in: notificationIds } }, { $set: { isRead: true } } ); console.log(`Marked ${updateResult.modifiedCount} notifications as read for user ${username}.`); } catch (updateError) { console.error(`Error marking notifications as read for user ${username}:`, updateError); } } else { console.log(`No unread notifications to mark for user ${username} on this fetch.`); } console.log(`Found ${notifications.length} notifications for user ${username}.`); res.status(200).json(notifications); } catch (error) { console.error(`Error fetching notifications for user ${username}:`, error); res.status(500).json({ message: 'Server error fetching notifications', error: error.message }); } });
router.get('/notifications/unread-count', async (req, res) => { /* ... no changes ... */ const { username } = req.query; console.log(`>>> ROUTE MATCH: /notifications/unread-count for user: ${username}`); if (!username) { return res.status(400).json({ message: 'Username query parameter is required.' }); } try { const unreadCount = await Notification.countDocuments({ recipientUsername: username, isRead: false }); console.log(`Found ${unreadCount} unread notifications for user ${username}.`); res.status(200).json({ unreadCount: unreadCount }); } catch (error) { console.error(`Error fetching unread notification count for user ${username}:`, error); res.status(500).json({ message: 'Server error fetching notification count', error: error.message }); } });

// --- Single Post Interaction Routes ---
router.get('/:postId', async (req, res) => { /* ... no changes ... */ console.log(`>>> ROUTE MATCH: GET /:postId attempting to match for postId: ${req.params.postId}`); const { postId } = req.params; if (!mongoose.Types.ObjectId.isValid(postId)) { console.error("Invalid Post ID format detected in GET /:postId route:", postId); return res.status(400).json({ message: 'Invalid Post ID format.' }); } try { const post = await Post.findById(postId); if (!post) { return res.status(404).json({ message: 'Post not found.' }); } console.log(`Found post ${postId}, returning details.`); res.status(200).json(post.toJSON()); } catch (error) { console.error(`Error fetching single post ${postId}:`, error); res.status(500).json({ message: 'Server error fetching post details', error: error.message }); } });
router.post('/:postId/like', async (req, res) => { /* ... no changes ... */ const { postId } = req.params; const { username } = req.body; console.log(`Received POST /${postId}/like from user: ${username}`); if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); } if (!username) { return res.status(400).json({ message: 'Username is required for like.' }); } try { const post = await Post.findById(postId); if (!post) { return res.status(404).json({ message: 'Post not found.' }); } const alreadyLiked = post.likes.some(like => like.username === username); if (alreadyLiked) { console.log(`User ${username} already liked post ${postId}. No change.`); return res.status(200).json(post.toJSON()); } post.likes.push({ username: username }); const updatedPost = await post.save(); console.log(`User ${username} liked post ${postId}. New count: ${updatedPost.likes.length}`); await createNotification(updatedPost.username, username, 'like', updatedPost); res.status(200).json(updatedPost.toJSON()); } catch (error) { console.error(`Error liking post ${postId}:`, error); res.status(500).json({ message: 'Server error liking post', error: error.message }); } });

// *** MODIFIED: Add reply notification logic ***
router.post('/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { username, text, parentId } = req.body; // username = replier/commenter
    console.log(`Received POST /${postId}/comments from user: ${username} with text: "${text}" ${parentId ? `(Reply to: ${parentId})` : ''}`);

    if (!mongoose.Types.ObjectId.isValid(postId)) { return res.status(400).json({ message: 'Invalid Post ID format.' }); }
    if (!username || !text) { return res.status(400).json({ message: 'Username and comment text are required.' }); }
    if (text.length > 500) { return res.status(400).json({ message: 'Comment text cannot exceed 500 characters.' }); }
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) { return res.status(400).json({ message: 'Invalid Parent Comment ID format.' }); }

    try {
        const post = await Post.findById(postId);
        if (!post) { return res.status(404).json({ message: 'Post not found.' }); }

        let parentComment = null;
        if (parentId) {
            parentComment = post.comments.id(parentId);
            if (!parentComment) {
                return res.status(400).json({ message: 'Parent comment not found in this post.' });
            }
        }

        const newComment = { username: username, text: text, timestamp: new Date(), parentId: parentId || null };
        post.comments.push(newComment);
        const updatedPost = await post.save();
        const savedComment = updatedPost.comments[updatedPost.comments.length - 1]; // Get the newly saved comment with its ID

        console.log(`User ${username} ${parentId ? 'replied' : 'commented'} on post ${postId}. New count: ${updatedPost.comments.length}`);

        // --- Notification Logic ---
        const postOwner = updatedPost.username;
        const notificationType = parentId ? 'reply' : 'comment';

        // 1. Notify Post Owner (always, unless they are the commenter/replier)
        await createNotification(postOwner, username, notificationType, updatedPost, text, parentId);

        // 2. Notify Parent Comment Author (if it's a reply and they are not the post owner or replier)
        if (parentId && parentComment) {
            const parentAuthor = parentComment.username;
            if (parentAuthor !== postOwner && parentAuthor !== username) {
                console.log(`Sending reply notification also to parent comment author: ${parentAuthor}`);
                await createNotification(parentAuthor, username, 'reply', updatedPost, text, parentId);
            }
        }
        // --- End Notification Logic ---

        res.status(201).json(updatedPost.toJSON());
    } catch (error) {
        console.error(`Error adding comment/reply to post ${postId}:`, error);
        if (error.name === 'ValidationError') { return res.status(400).json({ message: 'Validation failed', error: error.message }); }
        res.status(500).json({ message: 'Server error adding comment', error: error.message });
    }
});

router.delete('/:postId/comments/:commentId', async (req, res) => { /* ... no changes ... */ const { postId, commentId } = req.params; const { username } = req.body; console.log(`Received DELETE /${postId}/comments/${commentId} request from user: ${username}`); if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) { return res.status(400).json({ message: 'Invalid Post or Comment ID format.' }); } if (!username) { return res.status(400).json({ message: 'Username is required to delete comment.' }); } try { const post = await Post.findById(postId); if (!post) { return res.status(404).json({ message: 'Post not found.' }); } const comment = post.comments.id(commentId); if (!comment) { return res.status(404).json({ message: 'Comment not found.' }); } if (post.username !== username && comment.username !== username) { console.warn(`User ${username} attempted to delete comment ${commentId} (owned by ${comment.username}) on post ${postId} (owned by ${post.username}). Forbidden.`); return res.status(403).json({ message: 'You are not authorized to delete this comment.' }); } post.comments.pull({ _id: commentId }); const updatedPost = await post.save(); console.log(`Comment ${commentId} (by ${comment.username}) deleted from post ${postId} by user ${username}.`); res.status(200).json(updatedPost.toJSON()); } catch (error) { console.error(`Error deleting comment ${commentId} from post ${postId}:`, error); res.status(500).json({ message: 'Server error deleting comment', error: error.message }); } });
router.post('/:postId/comments/:commentId/upvote', async (req, res) => { /* ... no changes ... */ const { postId, commentId } = req.params; const { username } = req.body; console.log(`Received POST /${postId}/comments/${commentId}/upvote request from user: ${username}`); if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) { return res.status(400).json({ message: 'Invalid Post or Comment ID format.' }); } if (!username) { return res.status(400).json({ message: 'Username is required to upvote.' }); } try { const post = await Post.findById(postId); if (!post) { return res.status(404).json({ message: 'Post not found.' }); } const comment = post.comments.id(commentId); if (!comment) { return res.status(404).json({ message: 'Comment not found.' }); } const upvoteIndex = comment.upvotes.indexOf(username); if (upvoteIndex === -1) { console.log(`User ${username} upvoting comment ${commentId}`); comment.upvotes.addToSet(username); } else { console.log(`User ${username} un-upvoting comment ${commentId}`); comment.upvotes.pull(username); } const updatedPost = await post.save(); const updatedComment = updatedPost.comments.id(commentId); res.status(200).json({ postId: updatedPost._id, commentId: updatedComment._id, upvotes: updatedComment.upvotes, upvoteCount: updatedComment.upvoteCount }); } catch (error) { console.error(`Error upvoting comment ${commentId} on post ${postId}:`, error); res.status(500).json({ message: 'Server error upvoting comment', error: error.message }); } });
router.delete('/:postId', async (req, res) => { /* ... no changes ... */ const { postId } = req.params; const { username } = req.body; console.log(`Received DELETE /${postId} request from user: ${username}`); if (!mongoose.Types.ObjectId.isValid(postId)) { console.error("Invalid Post ID format for DELETE:", postId); return res.status(400).json({ message: 'Invalid Post ID format.' }); } if (!username) { console.error("Username missing in DELETE request body for post:", postId); return res.status(400).json({ message: 'Username is required for deletion.' }); } try { const post = await Post.findById(postId); if (!post) { console.log(`Post ${postId} not found for deletion.`); return res.status(404).json({ message: 'Post not found.' }); } if (post.username !== username) { console.warn(`User ${username} attempted to delete post ${postId} owned by ${post.username}. Forbidden.`); return res.status(403).json({ message: 'You are not authorized to delete this post.' }); } await Post.findByIdAndDelete(postId); console.log(`Post ${postId} deleted successfully by user ${username}.`); try { const deleteNotifResult = await Notification.deleteMany({ postId: postId }); console.log(`Deleted ${deleteNotifResult.deletedCount} associated notifications for post ${postId}.`); } catch (notifError) { console.error(`Error deleting associated notifications for post ${postId}:`, notifError); } res.status(200).json({ message: 'Post deleted successfully.', deletedPostId: postId }); } catch (error) { console.error(`Error deleting post ${postId}:`, error); res.status(500).json({ message: 'Server error deleting post', error: error.message }); } });

module.exports = router;