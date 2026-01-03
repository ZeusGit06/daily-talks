// backend/routes/api.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const profileRoutes = require('./profiles');
const notificationRoutes = require('./notifications');
const postRoutes = require('./posts');

// Helper to log requests
router.use((req, res, next) => {
    // console.log(`API Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/notifications', notificationRoutes);

// Post routes handles /posts, /my-posts, and /:postId (parameterized)
// Note: Parameterized routes (/:postId) often catch everything, so be careful with order.
// Since /auth, /profiles, /notifications are explicit paths, they should be defined first (or handled by mounting above).
// In server.js, we mount this whole router at /api.
// So /api/auth goes to authRoutes.
// /api/posts goes to postRoutes (if we mount it at root here).
// postRoutes handles /posts and /:postId.
// If we mount postRoutes at '/', then:
// /api/posts -> postRoutes matches '/posts'
// /api/my-posts -> postRoutes matches '/my-posts'
// /api/foobar -> postRoutes matches '/:postId'
// So mounting postRoutes at root is correct, provided it's the last one.

router.use('/', postRoutes);

module.exports = router;