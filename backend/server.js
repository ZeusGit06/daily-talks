// backend/server.js
require('dotenv').config(); // Load .env file from root
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api.js'); // Import the API router

const app = express();
const PORT = process.env.PORT || 3001; // Use port from .env or default

// --- Middleware ---
app.use(cors()); // Allow requests from different origins (your frontend)
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

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

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});