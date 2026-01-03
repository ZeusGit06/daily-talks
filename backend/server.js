// backend/server.js
require('dotenv').config(); // Load .env file from root
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const apiRoutes = require('./routes/api.js'); // Import the API router

const app = express();
const PORT = parseInt(process.env.PORT || 3001, 10); // Use port from .env or default

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite dev server
    'https://daily-talks.onrender.com', // Production domain
    'http://daily-talks.onrender.com', // Production domain (http)
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        // Also allow any localhost origin for development flexibility
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/auth headers
    optionsSuccessStatus: 200
};

// --- Rate Limiting Configuration ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: { message: 'Too many login/register attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Middleware ---
app.use(cors(corsOptions)); // Apply CORS with specific origins
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Apply rate limiting to all API routes
app.use('/api', generalLimiter);
// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter);

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- API Routes ---
// Mount the API routes under the /api prefix
app.use('/api', apiRoutes);

// --- Serve Frontend Static Files ---
// Define the path to the public directory
const publicPath = path.join(__dirname, '..', 'public');
console.log(`Serving static files from: ${publicPath}`);
// Static middleware should handle manifest.json, icons, css, js etc.
app.use(express.static(publicPath));

// --- Catch-all Route for SPA ---
// This route should come AFTER API routes and static file serving.
app.get('*', (req, res) => {
    // Log requests being handled by the catch-all (should NOT log for static files)
    console.log(`SPA Catch-all triggered for: ${req.path}, sending index.html`);
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
            console.error("Error sending index.html:", err);
            res.status(500).send("Server error sending main page.");
        }
    });
});
// --- End Catch-all Route ---

// --- Start Server with Port Fallback ---
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', e);
        }
    });
};

startServer(PORT);