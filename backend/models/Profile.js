// backend/models/Profile.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [6, 'Password must be at least 6 characters long.']
    },
    isPublic: {
        type: Boolean,
        required: true,
        default: true // Profiles are public by default unless specified otherwise
    },
    // Add other profile fields later as needed:
    // preferredLanguage: { type: String, default: 'en' }, // Example
    // profilePictureUrl: { type: String, default: '/path/to/default/avatar.png' }, // Example
    hearts: {
        type: [String], // Array of usernames who hearted this profile
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    // No TTL needed for profiles
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: true }, // Use default timestamps, especially updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for heart count
profileSchema.virtual('heartCount').get(function () {
    return this.hearts.length;
});

// Pre-save hook to hash password
profileSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
profileSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Add a method to safely get profile data (excluding sensitive fields if any added later)
profileSchema.methods.toJSON = function () {
    const profile = this.toObject();
    delete profile.password; // Always remove password from JSON output
    // delete profile.someSensitiveField;
    return profile;
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;