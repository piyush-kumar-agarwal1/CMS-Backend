// Simple test for auth routes
// Run with: node tests/authRoutes.test.js

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const testRegularLogin = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Regular login successful:', response.data);
    } catch (error) {
        console.error('Regular login failed:', error.response?.data || error.message);
    }
};

const testGoogleAuthEndpoint = async () => {
    try {
        // This is just to test if the endpoint exists and responds
        // Will fail without a real token
        await axios.post(`${API_URL}/auth/google`, {
            accessToken: 'fake-token-for-testing'
        });
    } catch (error) {
        // Should get a 401 since we're using a fake token
        if (error.response?.status === 401) {
            console.log('Google auth endpoint exists and is validating tokens correctly');
        } else {
            console.error('Google auth endpoint issue:', error.response?.data || error.message);
        }
    }
};

const runTests = async () => {
    console.log('Testing auth routes...');
    await testRegularLogin();
    await testGoogleAuthEndpoint();
    console.log('Tests completed');
};

runTests();