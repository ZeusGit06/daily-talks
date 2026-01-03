// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const appContent = document.getElementById('app-content');
    const bottomNav = document.getElementById('bottom-nav');
    const navButtons = document.querySelectorAll('.nav-button');
    const sectionTitle = document.getElementById('section-title');
    const offlineIndicator = document.getElementById('offline-indicator');

    // Modals
    const ageConfirmModal = document.getElementById('age-confirm-modal');
    const confirmAgeButton = document.getElementById('confirm-age-button');
    const infoModal = document.getElementById('info-modal');
    const confirmInfoButton = document.getElementById('confirm-info-button');
    const authModal = document.getElementById('auth-modal');
    const settingsModal = document.getElementById('settings-modal');
    const settingsButton = document.getElementById('settings-button');
    const closeSettingsButton = document.getElementById('close-settings-button');
    const themeToggle = document.getElementById('theme-toggle');
    const logoutButton = document.getElementById('logout-button');

    // Auth Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // --- State ---
    let currentUsername = null;
    let authToken = null; // JWT Token
    let currentSection = 'home';
    const USERNAME_KEY = 'dailyTalksUsername';
    const TOKEN_KEY = 'dailyTalksToken';
    const AGE_CONFIRM_KEY = 'dailyTalksAgeConfirmed';
    const INFO_SEEN_KEY = 'dailyTalksInfoSeen';
    const THEME_KEY = 'dailyTalksTheme';

    // --- API Base URL ---
    const API_BASE_URL = '/api';

    // --- SVG Icons ---
    const ICONS = {
        heartFilled: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        heartOutline: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        comment: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
        reply: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>',
        trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
        close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
    };

    // --- Initialization ---
    // Moved to the end of DOMContentLoaded to ensure listeners are attached first.

    function init() {
        console.log("App initializing...");
        try {
            loadTheme();
            checkOfflineStatus();
            window.addEventListener('online', checkOfflineStatus);
            window.addEventListener('offline', checkOfflineStatus);

            // Check Age Confirmation
            if (!localStorage.getItem(AGE_CONFIRM_KEY)) {
                ageConfirmModal.hidden = false;
            } else {
                checkInfoSeen();
            }
        } catch (err) {
            console.error("Initialization error:", err);
            // Even if init fails, we want listeners to be attached.
        }
    }

    function checkInfoSeen() {
        if (!localStorage.getItem(INFO_SEEN_KEY)) {
            infoModal.hidden = false;
        } else {
            checkAuth();
        }
    }

    function checkAuth() {
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        const storedToken = localStorage.getItem(TOKEN_KEY);

        if (storedUsername && storedToken) {
            currentUsername = storedUsername;
            authToken = storedToken;
            loadSection('home');
            fetchUnreadCount(); // Check for notifications on load
            startNotificationPolling(); // Start periodic polling
        } else {
            showAuthModal();
        }
    }

    function showAuthModal() {
        authModal.hidden = false;
        loginForm.hidden = false;
        registerForm.hidden = true;
    }

    // --- Event Listeners ---

    // Age & Info Modals
    confirmAgeButton.addEventListener('click', () => {
        localStorage.setItem(AGE_CONFIRM_KEY, 'true');
        ageConfirmModal.hidden = true;
        checkInfoSeen();
    });

    confirmInfoButton.addEventListener('click', () => {
        localStorage.setItem(INFO_SEEN_KEY, 'true');
        infoModal.hidden = true;
        checkAuth();
    });

    // Auth Modal Switching
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.hidden = true;
        registerForm.hidden = false;
        loginError.style.display = 'none';
        registerError.style.display = 'none';
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.hidden = true;
        loginForm.hidden = false;
        loginError.style.display = 'none';
        registerError.style.display = 'none';
    });

    // Login Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                handleAuthSuccess(data.user.username, data.token);
            } else {
                showError(loginError, data.message || 'Login failed.');
            }
        } catch (error) {
            showError(loginError, 'Network error. Please try again.');
        }
    });

    // Register Submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const isPublic = document.querySelector('input[name="registerVisibility"]:checked').value === 'public';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, isPublic })
            });
            const data = await response.json();

            if (response.ok) {
                handleAuthSuccess(data.user.username, data.token);
            } else {
                showError(registerError, data.message || 'Registration failed.');
            }
        } catch (error) {
            showError(registerError, 'Network error. Please try again.');
        }
    });

    function handleAuthSuccess(username, token) {
        currentUsername = username;
        authToken = token;
        localStorage.setItem(USERNAME_KEY, username);
        localStorage.setItem(TOKEN_KEY, token);
        authModal.hidden = true;
        loadSection('home');
        fetchUnreadCount(); // Check for notifications after login
        startNotificationPolling(); // Start periodic polling
    }

    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            logout();
        });
    }

    function logout() {
        localStorage.removeItem(USERNAME_KEY);
        localStorage.removeItem(TOKEN_KEY);
        currentUsername = null;
        authToken = null;
        settingsModal.hidden = true;
        showAuthModal();
    }

    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            loadSection(section);
        });
    });

    // Settings
    settingsButton.addEventListener('click', () => { settingsModal.hidden = false; });
    closeSettingsButton.addEventListener('click', () => { settingsModal.hidden = true; });

    // Theme Toggle
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem(THEME_KEY, 'light');
        }
    });

    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
    }

    function checkOfflineStatus() {
        if (!navigator.onLine) {
            offlineIndicator.hidden = false;
        } else {
            offlineIndicator.hidden = true;
        }
    }

    // --- Notification Badge ---
    let notificationPollInterval = null;

    async function fetchUnreadCount() {
        if (!authToken) return;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/notifications/unread-count`);
            if (response.ok) {
                const data = await response.json();
                updateNotificationBadge(data.unreadCount);
            }
        } catch (error) {
            console.log('Could not fetch notification count');
        }
    }

    function updateNotificationBadge(count) {
        const notifBtn = document.querySelector('.nav-button[data-section="notifications"]');
        if (!notifBtn) return;

        // Remove existing badge
        let badge = notifBtn.querySelector('.notif-badge');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                notifBtn.appendChild(badge);
            }
            badge.textContent = count > 9 ? '9+' : count;
        } else if (badge) {
            badge.remove();
        }
    }

    function startNotificationPolling() {
        if (notificationPollInterval) {
            clearInterval(notificationPollInterval);
        }
        // Poll every 30 seconds
        notificationPollInterval = setInterval(fetchUnreadCount, 30000);
    }

    // --- Section Loading Logic ---

    function loadSection(section) {
        currentSection = section;

        // Update Nav UI
        navButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-button[data-section="${section}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update Header Title
        sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);

        // Clear Content
        appContent.innerHTML = '<div class="loading-spinner">Loading...</div>';

        // Load Content based on section
        switch (section) {
            case 'home':
                loadHomeFeed();
                break;
            case 'notifications':
                loadNotifications();
                break;
            case 'create':
                renderCreatePost();
                break;
            case 'profile':
                loadProfile(currentUsername); // Load own profile
                break;
            default:
                loadHomeFeed();
        }
    }

    // --- API Interactions (Authenticated) ---

    async function fetchWithAuth(url, options = {}) {
        if (!authToken) {
            logout();
            throw new Error('No auth token');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            logout(); // Token expired or invalid
            throw new Error('Unauthorized');
        }

        return response;
    }

    // --- Home Feed ---
    async function loadHomeFeed() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts?sort=latest`); // Public endpoint
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            appContent.innerHTML = '<p class="error-message">Failed to load posts.</p>';
        }
    }

    // --- Create Post ---
    function renderCreatePost() {
        appContent.innerHTML = `
            <div class="create-post-container">
                <textarea id="new-post-text" placeholder="What's on your mind? (Expires in 24h)" maxlength="280"></textarea>
                <div class="char-count">0/280</div>
                <button id="submit-post-button" class="confirm-button">Post</button>
            </div>
        `;

        const textarea = document.getElementById('new-post-text');
        const charCount = document.querySelector('.char-count');
        const submitBtn = document.getElementById('submit-post-button');

        textarea.addEventListener('input', () => {
            charCount.textContent = `${textarea.value.length}/280`;
        });

        submitBtn.addEventListener('click', async () => {
            const text = textarea.value.trim();
            if (!text) return;

            try {
                const response = await fetchWithAuth(`${API_BASE_URL}/posts`, {
                    method: 'POST',
                    body: JSON.stringify({ text })
                });

                if (response.ok) {
                    loadSection('home');
                } else {
                    alert('Failed to create post.');
                }
            } catch (error) {
                console.error(error);
                alert('Error creating post.');
            }
        });
    }

    // --- Profile ---
    async function loadProfile(username) {
        try {
            // Fetch Profile Data
            const profileRes = await fetch(`${API_BASE_URL}/profiles/${username}`);
            if (!profileRes.ok) throw new Error('Profile not found');
            const profile = await profileRes.json();

            // Fetch Posts (Public or My Posts)
            let postsUrl = `${API_BASE_URL}/profiles/${username}/posts`;

            let postsRes;
            if (username === currentUsername) {
                postsRes = await fetchWithAuth(`${API_BASE_URL}/my-posts`);
            } else {
                postsRes = await fetch(postsUrl);
            }

            let posts = [];
            if (postsRes.ok) {
                posts = await postsRes.json();
            } else if (postsRes.status === 403) {
                // Private profile
                posts = null;
            }

            renderProfileView(profile, posts);

        } catch (error) {
            appContent.innerHTML = `<p class="error-message">Error loading profile: ${escapeHtml(error.message)}</p>`;
        }
    }

    function renderProfileView(profile, posts) {
        let postsHtml = '';
        if (posts === null) {
            postsHtml = `<div class="private-profile-message">${ICONS.lock} This profile is private.</div>`;
        } else if (posts.length === 0) {
            postsHtml = '<div class="no-posts-message">No posts yet.</div>';
        } else {
            postsHtml = posts.map(post => createPostElement(post).outerHTML).join('');
        }

        const isOwnProfile = profile.username === currentUsername;
        let visibilityControl = '';
        if (isOwnProfile) {
            visibilityControl = `
                <div class="profile-visibility-control">
                    <span>Visibility: <strong>${profile.isPublic ? 'Public' : 'Private'}</strong></span>
                    <button id="toggle-visibility-btn" class="small-button">Change</button>
                </div>
            `;
        }

        const isHearted = profile.hearts && profile.hearts.includes(currentUsername);
        const heartCount = profile.hearts ? profile.hearts.length : 0;
        const heartButtonHtml = !isOwnProfile ?
            `<button id="toggle-heart-btn" class="action-btn ${isHearted ? 'liked' : ''}" style="font-size: 1.2rem; margin-top: 10px;">
                ${isHearted ? ICONS.heartFilled : ICONS.heartOutline} <span>${heartCount}</span>
            </button>` :
            `<div class="hearts-display">${ICONS.heartFilled} <span>${heartCount} Hearts</span></div>`;

        appContent.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-placeholder">${escapeHtml(profile.username).charAt(0).toUpperCase()}</div>
                <h2>${escapeHtml(profile.username)}</h2>
                <p>Joined: ${new Date(profile.createdAt).toLocaleDateString()}</p>
                ${heartButtonHtml}
                ${visibilityControl}
            </div>
            <div class="profile-posts">
                <h3>Posts</h3>
                ${postsHtml}
            </div>
        `;

        // Add event listener for visibility toggle
        if (isOwnProfile) {
            document.getElementById('toggle-visibility-btn').addEventListener('click', async () => {
                const newStatus = !profile.isPublic;
                try {
                    const res = await fetchWithAuth(`${API_BASE_URL}/profiles/me/visibility`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isPublic: newStatus })
                    });
                    if (res.ok) {
                        loadProfile(currentUsername); // Reload
                    }
                } catch (e) {
                    alert('Failed to update visibility');
                }
            });
        } else {
            // Heart Button Listener
            const heartBtn = document.getElementById('toggle-heart-btn');
            if (heartBtn) {
                heartBtn.addEventListener('click', async () => {
                    try {
                        const res = await fetchWithAuth(`${API_BASE_URL}/profiles/${profile.username}/heart`, { method: 'POST' });
                        if (res.ok) {
                            const data = await res.json();
                            const newIsHearted = data.isHearted;
                            heartBtn.innerHTML = `${newIsHearted ? ICONS.heartFilled : ICONS.heartOutline} <span>${data.heartCount}</span>`;
                            heartBtn.classList.toggle('liked', newIsHearted);
                        }
                    } catch (e) {
                        alert('Error hearting profile');
                    }
                });
            }
        }

        // Re-attach event listeners for posts
        if (posts && posts.length > 0) {
            const postsContainer = appContent.querySelector('.profile-posts');
            postsContainer.innerHTML = '<h3>Posts</h3>'; // Clear string version
            posts.forEach(post => {
                postsContainer.appendChild(createPostElement(post));
            });
        }
    }

    // --- Notifications ---
    async function loadNotifications() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/notifications`);
            const notifications = await response.json();

            // Clear the badge since viewing marks them as read
            updateNotificationBadge(0);

            if (notifications.length === 0) {
                appContent.innerHTML = '<p class="text-center padding-1">No notifications.</p>';
                return;
            }

            appContent.innerHTML = '<div class="notifications-list"></div>';
            const list = appContent.querySelector('.notifications-list');

            notifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = `notification-item ${notif.isRead ? 'read' : 'unread'} notif-${notif.type}`;
                item.innerHTML = `
                    <div class="notif-icon">${getNotificationIcon(notif.type)}</div>
                    <div class="notif-content">
                        <p>
                            <strong>${escapeHtml(notif.senderUsername)}</strong> 
                            ${getNotificationText(notif)}
                        </p>
                        <small>${new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                `;
                list.appendChild(item);
            });
        } catch (error) {
            appContent.innerHTML = '<p class="error-message">Failed to load notifications.</p>';
        }
    }

    function getNotificationIcon(type) {
        switch (type) {
            case 'like': return ICONS.heartFilled;
            case 'comment': return ICONS.comment;
            case 'reply': return ICONS.reply;
            default: return ICONS.comment;
        }
    }

    function getNotificationText(notif) {
        switch (notif.type) {
            case 'like': return `liked your post: "${escapeHtml(notif.postTextSnippet)}"`;
            case 'comment': return `commented on your post: "${escapeHtml(notif.commentTextSnippet)}"`;
            case 'reply': return `replied to your comment: "${escapeHtml(notif.commentTextSnippet)}"`;
            default: return 'interacted with you.';
        }
    }

    // --- Shared Post Rendering ---
    function renderPosts(posts) {
        appContent.innerHTML = '';
        if (posts.length === 0) {
            appContent.innerHTML = '<p class="text-center padding-1">No posts to show.</p>';
            return;
        }

        const feedContainer = document.createElement('div');
        feedContainer.className = 'feed-container';

        posts.forEach(post => {
            feedContainer.appendChild(createPostElement(post));
        });

        appContent.appendChild(feedContainer);
    }

    function createPostElement(post) {
        const el = document.createElement('div');
        el.className = 'post-card';

        const isLiked = post.likes && post.likes.some(l => l.username === currentUsername);

        el.innerHTML = `
            <div class="post-header">
                <span class="post-author">${escapeHtml(post.username)}</span>
                <span class="post-time">${timeAgo(new Date(post.createdAt))}</span>
            </div>
            <div class="post-content">${escapeHtml(post.text)}</div>
            <div class="post-actions">
                <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${escapeHtml(post._id)}">
                    ${isLiked ? ICONS.heartFilled : ICONS.heartOutline} <span>${post.likes ? post.likes.length : 0}</span>
                </button>
                <button class="action-btn comment-btn" data-id="${escapeHtml(post._id)}">
                    ${ICONS.comment} <span>${post.commentCount || 0}</span>
                </button>
                ${post.username === currentUsername ? `<button class="action-btn delete-btn" data-id="${escapeHtml(post._id)}">${ICONS.trash}</button>` : ''}
            </div>
        `;

        // Event Listeners
        el.querySelector('.like-btn').addEventListener('click', (e) => handleLike(post._id, e.currentTarget));
        el.querySelector('.comment-btn').addEventListener('click', () => loadSinglePost(post._id));
        if (post.username === currentUsername) {
            el.querySelector('.delete-btn').addEventListener('click', () => handleDeletePost(post._id));
        }
        el.querySelector('.post-author').addEventListener('click', () => loadProfile(post.username));

        return el;
    }

    async function handleLike(postId, btn) {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/${postId}/like`, { method: 'POST' });
            if (res.ok) {
                const updatedPost = await res.json();
                const isLiked = updatedPost.likes.some(l => l.username === currentUsername);
                btn.innerHTML = `${isLiked ? ICONS.heartFilled : ICONS.heartOutline} <span>${updatedPost.likes.length}</span>`;
                btn.classList.toggle('liked', isLiked);
            }
        } catch (e) {
            // alert('Login to like posts'); 
        }
    }

    async function handleDeletePost(postId) {
        if (!confirm('Delete this post?')) return;
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/${postId}`, { method: 'DELETE' });
            if (res.ok) {
                loadSection(currentSection); // Reload current view
            }
        } catch (e) {
            alert('Failed to delete post');
        }
    }

    // --- Single Post View (Comments) ---
    async function loadSinglePost(postId) {
        try {
            const res = await fetch(`${API_BASE_URL}/${postId}`);
            if (!res.ok) throw new Error('Post not found');
            const post = await res.json();
            renderSinglePost(post);
        } catch (e) {
            alert('Error loading post');
        }
    }

    function renderSinglePost(post) {
        currentSection = 'single-post';
        sectionTitle.textContent = 'Post';
        appContent.innerHTML = '';

        const postEl = createPostElement(post);
        postEl.querySelector('.comment-btn').disabled = true; // Disable comment button in single view

        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section';

        // Reply State
        let replyingToId = null;
        let replyingToUsername = null;

        commentsSection.innerHTML = `
            <h3>Comments</h3>
            <div class="comment-form">
                <div id="replying-indicator" style="display: none; font-size: 0.9em; color: var(--primary-color); margin-bottom: 5px;">
                    Replying to <span id="reply-username"></span> 
                    <button id="cancel-reply-btn" class="cancel-reply-btn">${ICONS.close}</button>
                </div>
                <input type="text" id="comment-input" placeholder="Add a comment...">
                <button id="submit-comment-btn">Send</button>
            </div>
            <div class="comments-list"></div>
        `;

        // Organize comments into tree
        const commentMap = {};
        const rootComments = [];

        // Initialize map
        post.comments.forEach(c => {
            c.children = [];
            commentMap[c.id] = c;
        });

        // Build tree
        post.comments.forEach(c => {
            if (c.parentId && commentMap[c.parentId]) {
                commentMap[c.parentId].children.push(c);
            } else {
                rootComments.push(c);
            }
        });

        const list = commentsSection.querySelector('.comments-list');

        function createCommentNode(comment, level = 0) {
            const container = document.createElement('div');
            container.className = 'comment-thread';
            if (level > 0) container.style.marginLeft = '20px';
            if (level > 0) container.style.borderLeft = '2px solid var(--border-color)';
            if (level > 0) container.style.paddingLeft = '10px';

            const commentEl = document.createElement('div');
            commentEl.className = 'comment-item';
            commentEl.innerHTML = `
                <div class="comment-header">
                    <strong>${escapeHtml(comment.username)}</strong>
                    <small>${timeAgo(new Date(comment.timestamp))}</small>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                     <button class="small-button reply-btn" data-id="${comment.id}" data-username="${escapeHtml(comment.username)}">Reply</button>
                </div>
            `;

            // Handle Reply Click
            commentEl.querySelector('.reply-btn').addEventListener('click', () => {
                replyingToId = comment.id;
                replyingToUsername = comment.username;

                const indicator = commentsSection.querySelector('#replying-indicator');
                const usernameSpan = commentsSection.querySelector('#reply-username');
                const input = commentsSection.querySelector('#comment-input');

                indicator.style.display = 'block';
                usernameSpan.textContent = replyingToUsername;
                input.placeholder = `Reply to ${replyingToUsername}...`;
                input.focus();
            });

            container.appendChild(commentEl);

            if (comment.children.length > 0) {
                const childrenContainer = document.createElement('div');
                comment.children.forEach(child => {
                    childrenContainer.appendChild(createCommentNode(child, level + 1));
                });
                container.appendChild(childrenContainer);
            }

            return container;
        }

        rootComments.forEach(root => {
            list.appendChild(createCommentNode(root));
        });

        // Cancel Reply
        commentsSection.querySelector('#cancel-reply-btn').addEventListener('click', () => {
            replyingToId = null;
            replyingToUsername = null;
            commentsSection.querySelector('#replying-indicator').style.display = 'none';
            commentsSection.querySelector('#comment-input').placeholder = "Add a comment...";
        });

        // Submit Comment/Reply
        commentsSection.querySelector('#submit-comment-btn').addEventListener('click', async () => {
            const input = commentsSection.querySelector('#comment-input');
            const text = input.value.trim();
            if (!text) return;

            try {
                const payload = { text };
                if (replyingToId) payload.parentId = replyingToId;

                const res = await fetchWithAuth(`${API_BASE_URL}/${post._id}/comments`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    loadSinglePost(post._id); // Reload to show new comment
                }
            } catch (e) {
                alert('Failed to post comment');
            }
        });

        appContent.appendChild(postEl);
        appContent.appendChild(commentsSection);
    }

    // --- Utilities ---
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    }
    // Initialize App
    init();
});