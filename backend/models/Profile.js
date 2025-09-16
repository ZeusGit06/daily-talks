// backend/models/Profile.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Username is required.'],
        unique: true, // Ensure usernames are unique in the database
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long.'],
        maxlength: [20, 'Username cannot exceed 20 characters.'],
        // Basic validation for allowed characters (alphanumeric + maybe underscore/dash)
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.'],
        index: true // Index for faster lookups
    },
    isPublic: {
        type: Boolean,
        required: true,
        default: true // Profiles are public by default unless specified otherwise
    },
    // Add other profile fields later as needed:
    // preferredLanguage: { type: String, default: 'en' }, // Example
    // profilePictureUrl: { type: String, default: '/path/to/default/avatar.png' }, // Example
    // heartCount: { type: Number, default: 0 }, // Example
    createdAt: {
        type: Date,
        default: Date.now
    }
    // No TTL needed for profiles
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: true } // Use default timestamps, especially updatedAt
});

// Add a method to safely get profile data (excluding sensitive fields if any added later)
profileSchema.methods.toJSON = function() {
  const profile = this.toObject();
  // Delete any sensitive fields if we add them later (e.g., email, password hash)
  // delete profile.someSensitiveField;
  return profile;
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;