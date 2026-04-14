const API_URL = 'http://localhost:3000/api'; // Change to https://sunbird-api-xxxx.onrender.com/api in production

// Local Storage Helper variables
const TOKEN_KEY = 'sunbird_admin_token';

// JWT Token Management
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

function isLoggedIn() {
    return !!getToken();
}

// Global Custom Error parsing class
class APIError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

// Internal Fetcher Engine bridging logic
async function apiRequest(endpoint, options = {}) {
    // Inject Authorization Headers natively
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        let data;
        try {
            data = await response.json();
        } catch(e) {
            data = null;
        }

        if (!response.ok) {
            throw new APIError(data?.error || 'Unknown API Exception Occurred', response.status);
        }

        return data;
    } catch (error) {
        console.error(`API Exception executing ${endpoint}:`, error.message);
        throw error;
    }
}

// Core HTTP Helpers exposed globally
async function apiGet(endpoint) {
    return await apiRequest(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, body) {
    return await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

async function apiPut(endpoint, body) {
    return await apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

async function apiPatch(endpoint, body) {
    return await apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(body)
    });
}

async function apiDelete(endpoint) {
    return await apiRequest(endpoint, { method: 'DELETE' });
}

// Globally expose references 
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiPatch = apiPatch;
window.apiDelete = apiDelete;
window.getToken = getToken;
window.setToken = setToken;
window.clearToken = clearToken;
window.isLoggedIn = isLoggedIn;
window.API_URL = API_URL;
