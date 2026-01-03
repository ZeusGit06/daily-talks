const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Check Username (Public)
router.get('/check-username', async (req, res) => {
    const { username } = req.query;
    if (!username) { return res.status(400).json({ message: 'Username query parameter is required.' }); }
    try {
        const existingProfile = await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }, '_id');
        res.status(200).json({ exists: !!existingProfile });
    } catch (error) {
        console.error(`Error checking username '${username}':`, error);
        res.status(500).json({ message: 'Server error checking username', error: error.message });
    }
});

// Get Profile (Public)
router.get('/:username', async (req, res) => {
    const requestedUsername = req.params.username;
    try {
        const profile = await Profile.findOne(
            { username: { $regex: new RegExp(`^${requestedUsername}$`, 'i') } },
            'username isPublic createdAt hearts'
        );
        if (!profile) { return res.status(404).json({ message: 'Profile not found.' }); }
        res.status(200).json(profile.toJSON());
    } catch (error) {
        console.error(`Error fetching profile for ${requestedUsername}:`, error);
        res.status(500).json({ message: 'Server error fetching profile', error: error.message });
    }
});

// Get Profile Posts (Public/Private check)
router.get('/:username/posts', async (req, res) => {
    const requestedUsername = req.params.username;
    try {
        const profile = await Profile.findOne(
            { username: { $regex: new RegExp(`^${requestedUsername}$`, 'i') } },
            'username isPublic'
        );
        if (!profile) { return res.status(404).json({ message: 'Profile not found.' }); }

        if (!profile.isPublic) {
            return res.status(403).json({ message: 'This profile is private.' });
        }

        const userPosts = await Post.find({ username: profile.username }).sort({ createdAt: -1 }).limit(100);
        res.status(200).json(userPosts.map(p => p.toJSON()));
    } catch (error) {
        console.error(`Error fetching posts for profile ${requestedUsername}:`, error);
        res.status(500).json({ message: 'Server error fetching profile posts', error: error.message });
    }
});

// Toggle Heart on Profile (Protected)
router.post('/:username/heart', auth, async (req, res) => {
    const targetUsername = req.params.username;
    const actorUsername = req.user.username; // From Token

    try {
        const profile = await Profile.findOne({ username: { $regex: new RegExp(`^${targetUsername}$`, 'i') } });
        if (!profile) { return res.status(404).json({ message: 'Profile not found.' }); }

        const heartIndex = profile.hearts.indexOf(actorUsername);
        if (heartIndex === -1) {
            profile.hearts.push(actorUsername);
        } else {
            profile.hearts.splice(heartIndex, 1);
        }
        await profile.save();

        res.status(200).json({
            hearts: profile.hearts,
            heartCount: profile.hearts.length,
            isHearted: profile.hearts.includes(actorUsername)
        });
    } catch (error) {
        console.error(`Error toggling heart for ${targetUsername}:`, error);
        res.status(500).json({ message: 'Server error toggling heart', error: error.message });
    }
});

// Update Visibility (Protected)
router.patch('/me/visibility', auth, async (req, res) => {
    const { isPublic } = req.body;
    const username = req.user.username; // From Token

    if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: 'isPublic (boolean) is required.' });
    }
    try {
        const updatedProfile = await Profile.findOneAndUpdate(
            { username: username },
            { $set: { isPublic: isPublic } },
            { new: true, runValidators: true, select: 'username isPublic' }
        );
        if (!updatedProfile) { return res.status(404).json({ message: 'Your profile not found.' }); }
        res.status(200).json(updatedProfile.toJSON());
    } catch (error) {
        console.error(`Error updating visibility for user ${username}:`, error);
        res.status(500).json({ message: 'Server error updating profile visibility', error: error.message });
    }
});

module.exports = router;
