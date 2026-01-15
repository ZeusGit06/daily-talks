
const axios = require('axios');
const assert = require('assert');

const API_BASE_URL = 'http://localhost:3000/api'; // Assuming server runs on port 3000

// A unique username for each test run
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'password123';
let authToken = null;

const XSS_PAYLOAD = '<script>alert("XSS")</script>';
const SANITIZED_PAYLOAD = ''; // Corrected expectation: the script tag and its content should be removed

const runTest = async () => {
    try {
        console.log('--- Running Security Test ---');

        // 1. Register a new user
        console.log(`[1/5] Registering user: ${testUsername}`);
        await axios.post(`${API_BASE_URL}/auth/register`, {
            username: testUsername,
            password: testPassword,
            isPublic: true
        });
        console.log('-> User registered successfully.');

        // 2. Login to get auth token
        console.log(`[2/5] Logging in as ${testUsername}`);
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: testUsername,
            password: testPassword
        });
        authToken = loginRes.data.token;
        assert(authToken, 'Login failed: No auth token received.');
        console.log('-> Login successful.');

        // 3. Create a post with XSS payload
        console.log('[3/5] Creating a post with malicious payload...');
        const postRes = await axios.post(`${API_BASE_URL}/posts`,
            { text: `This is a test post. ${XSS_PAYLOAD}` },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const postId = postRes.data._id;
        assert(postId, 'Post creation failed.');
        console.log(`-> Post created with ID: ${postId}`);

        // 4. Fetch the post and verify sanitization
        console.log('[4/5] Fetching post to verify sanitization...');
        const getPostRes = await axios.get(`${API_BASE_URL}/${postId}`);
        const postText = getPostRes.data.text;

        console.log(`  - Original payload: ${XSS_PAYLOAD}`);
        console.log(`  - Text from API:    ${postText}`);
        assert.strictEqual(postText, `This is a test post. ${SANITIZED_PAYLOAD}`, 'Post text was not sanitized correctly!');
        console.log('-> Post content is properly sanitized. ✅');

        // 5. Create a comment with XSS payload
        console.log('[5/5] Creating a comment with malicious payload...');
        await axios.post(`${API_BASE_URL}/${postId}/comments`,
            { text: `This is a test comment. ${XSS_PAYLOAD}` },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('-> Comment created.');

        // Refetch post to check the comment
        console.log('[Bonus] Fetching post again to verify comment sanitization...');
        const getPostRes2 = await axios.get(`${API_BASE_URL}/${postId}`);
        const commentText = getPostRes2.data.comments[0].text;

        console.log(`  - Original payload: ${XSS_PAYLOAD}`);
        console.log(`  - Comment from API: ${commentText}`);
        assert.strictEqual(commentText, `This is a test comment. ${SANITIZED_PAYLOAD}`, 'Comment text was not sanitized correctly!');
        console.log('-> Comment content is properly sanitized. ✅');


        console.log('\\n--- Security Test PASSED ---');
        process.exit(0);

    } catch (error) {
        console.error('\\n--- Security Test FAILED ---');
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
};

// Need to make sure the server is running before this script is executed.
// The plan step "Run the automated test suite" will need to handle this.
console.log('Note: This test requires the server to be running on http://localhost:3000');
console.log('Starting test in 2 seconds...');
setTimeout(runTest, 2000);
