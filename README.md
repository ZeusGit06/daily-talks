# Daily Talk's 🗣️

*An anonymous, ephemeral, mobile-first Progressive Web App (PWA) for sharing daily thoughts.*

---

## 📖 Table of Contents
- [About The Project](#-about-the-project)
- [✨ Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
- [⚙️ Configuration](#️-configuration)
- [▶️ Usage](#️-usage)
- [📁 Project Structure](#-project-structure)
- [🔌 API Endpoints](#-api-endpoints)
- [🔮 Future Enhancements](#-future-enhancements)

---

## 🌐 About The Project

"Daily Talk's" is a social journaling platform designed for low-pressure, transient sharing. It offers an alternative to mainstream social media where content is permanent and tied to a fixed identity.

The core principles of the application are:

*   **Anonymity:** Users do not create traditional accounts. A unique, anonymous username is generated or chosen during a one-time setup and stored locally, fostering uninhibited expression.
*   **Ephemerality:** All posts, along with their associated comments and likes, are automatically and permanently deleted from the database 24 hours after creation. This encourages in-the-moment sharing without the concern of a long-term digital footprint.
*   **Simplicity:** The focus is on clean, text-based communication within a minimalist, mobile-first interface that supports both light and dark themes.

It is built as a Progressive Web App (PWA) to provide an app-like, installable experience directly from the browser.

---

## ✨ Features

### Core & User Identity
- **Anonymous User Setup:** One-time setup to choose or generate a unique username.
- **Persistent Profiles:** Usernames, visibility settings, and heart counts are stored in the database.
- **Profile Visibility:** Users can set their profile to **Public** (default) or **Private**.
- **Age & Info Confirmation:** Onboarding modals ensure users are aware of the platform's nature.
- **PWA Ready:** Installable on mobile devices with a basic offline-capable app shell.
- **Light & Dark Themes:** User preference is saved locally.
- **Offline Indicator:** A banner appears when the user loses network connectivity.

### Post & Feed Interaction
- **Create Posts:** Simple text-only posts (1000 char limit).
- **24-Hour Post TTL:** Posts are automatically deleted from the database after 24 hours.
- **Dynamic Home Feed:** View posts from others with "Latest" and "Popular" (by like count) filters.
- **Like Posts:** Toggle likes on posts, with the like count updated in real-time.
- **Delete Own Posts:** Users can delete their own posts from their profile page.

### Comment System
- **Threaded Replies:** Reply to comments to create nested discussion threads.
- **Upvote Comments:** Upvote individual comments to show agreement.
- **Comment Sorting:** Sort comments by "Newest" or "Top" (most upvoted).
- **Author Highlighting:** Post author's comments are always grouped first and visually marked with an "Author" badge.
- **Comment Deletion:**
  - Post owners can delete any comment on their own posts.
  - Comment authors can delete their own comments on any post.

### Profile & Notification System
- **Clickable Usernames:** All usernames are clickable, leading to user profile pages.
- **User Profile Pages:**
  - View other users' profiles, including their username and total received hearts.
  - View posts of public profiles; a "Private" message is shown for private profiles.
  - **Send Hearts:** Give a permanent "heart" to another user's profile to show appreciation.
- **"My Profile" Page:** View your own posts, heart count, and change your profile visibility setting.
- **Comprehensive Notifications:** Receive notifications for:
  - Likes on your posts.
  - Comments on your posts.
  - Replies to your comments.
  - Hearts received on your profile.
- **Clickable Notifications:** Notifications for likes/comments/replies navigate directly to the post and highlight the relevant comment.
- **Unread Indicator:** A dot on the navigation bell icon indicates unread notifications.

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/) (v4)
- **Database:** [MongoDB](https://www.mongodb.com/) (hosted on MongoDB Atlas)
- **ODM:** [Mongoose](https://mongoosejs.com/)
- **Middleware:** [CORS](https://www.npmjs.com/package/cors), [dotenv](https://www.npmjs.com/package/dotenv)

### Frontend
- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **PWA:** Manifest & Service Worker API

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need the following software installed on your machine:
- [Node.js](https://nodejs.org/en/download/) (which includes npm)
- [Git](https://git-scm.com/downloads)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (a free cluster is sufficient).

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/daily-talks.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd daily-talks
    ```

3.  **Install NPM packages:**
    ```sh
    npm install
    ```

4.  **Create a configuration file:**
    - In the root directory of the project, create a file named `.env`.
    - You will need to add your MongoDB connection string and a port number to this file. See the [Configuration](#️-configuration) section below.

---

## ⚙️ Configuration

Create a `.env` file in the root of the project and add the following variables:

```env
# MongoDB Atlas Connection String
# Replace <username>, <password>, and <cluster-name> with your actual credentials
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/dailyTalksApp?retryWrites=true&w=majority

# Port for the server to run on
PORT=3000

---

▶️ Usage

Sh
node backend/server.js

---

📁 Project Structure

daily-talks/
├── backend/
│   ├── models/
│   │   ├── Notification.js  # Mongoose Schema for notifications
│   │   ├── Post.js          # Mongoose Schema for posts and comments
│   │   └── Profile.js       # Mongoose Schema for user profiles
│   ├── routes/
│   │   └── api.js           # All API endpoint definitions
│   └── server.js            # Express server setup and middleware
├── node_modules/
├── public/
│   ├── icons/
│   │   ├── icon-192.png     # PWA icon
│   │   └── icon-512.png     # PWA icon
│   ├── index.html           # Main SPA shell
│   ├── manifest.json        # PWA manifest
│   ├── script.js            # All client-side JavaScript logic
│   ├── service-worker.js    # PWA service worker for caching
│   └── style.css            # All CSS styles
├── .env                     # Environment variables (local, not committed)
├── .gitignore
├── package.json
└── README.md

---

🔌 API Endpoints
The API is served under the /api prefix.
Method	Endpoint	Description
POST	/posts	Create a new post.
GET	/posts	Get posts for the home feed (supports ?sort=popular).
GET	/my-posts	Get posts for the current user (?username=...).
POST	/profiles	Create a new user profile during setup.
GET	/profiles/check-username	Check if a username is available (?username=...).
GET	/profiles/:username	Get a user's public profile information.
GET	/profiles/:username/posts	Get posts for a user's profile (respects privacy).
POST	/profiles/:username/heart	Send a heart to a user's profile.
PATCH	/profiles/me/visibility	Update the current user's profile visibility.
GET	/notifications	Get notifications for the current user (?username=...).
GET	/notifications/unread-count	Get the count of unread notifications.
GET	/:postId	Get details for a single post.
POST	/:postId/like	Like/unlike a post.
DELETE	/:postId	Delete a post (owner only).
POST	/:postId/comments	Add a comment or a reply (with parentId).
DELETE	/:postId/comments/:commentId	Delete a comment (post owner or comment owner).
POST	/:postId/comments/:commentId/upvote	Upvote/un-upvote a comment.

---

🔮 Future Enhancements
Language Filtering: Allow users to tag posts by language and filter their feed by preferred languages.
Profile Pictures: Implement default letter-based avatars and allow optional custom image uploads.
Image Uploads for Posts: Allow users to attach a single image to their posts.
Advanced Comment Features: Implement comment downvoting and more sophisticated sorting ("Controversial").
UI/UX Polish: A full design pass to refine animations, spacing, typography, and accessibility.

---