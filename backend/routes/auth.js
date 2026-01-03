const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

// Register
router.post('/register', async (req, res) => {
    const { username, password, isPublic } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const existingProfile = await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingProfile) {
            return res.status(409).json({ message: 'Username already exists.', code: 'USERNAME_TAKEN' });
        }
        const newProfile = new Profile({ username, password, isPublic });
        await newProfile.save();

        const token = jwt.sign({ _id: newProfile._id, username: newProfile.username }, process.env.JWT_SECRET || 'default_secret_key_change_me', { expiresIn: '7d' });

        res.status(201).json({ user: newProfile.toJSON(), token });
    } catch (error) {
        console.error("Error registering user:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: 'Validation failed.', errors: messages });
        }
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const profile = await Profile.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!profile) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await profile.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ _id: profile._id, username: profile.username }, process.env.JWT_SECRET || 'default_secret_key_change_me', { expiresIn: '7d' });

        res.status(200).json({ user: profile.toJSON(), token });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

module.exports = router;
