const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper utility for simple email format validation
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

// ------------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Input Validation
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Password cannot be empty' });
        }

        // 2. Locate Database User
        const userResult = await db.query('SELECT id, email, password_hash, full_name, role, hotel_id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            // Returning generic invalid credentials to deter email guessing attacks
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // 3. Password Verification
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Token Generation
        // This signs the user's non-sensitive data combined with our JWT_SECRET
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name, hotel_id: user.hotel_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Security timeout automatically forces token invalidation
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// ------------------------------------------------------------------
// POST /api/auth/verify
// ------------------------------------------------------------------
router.post('/verify', requireAuth, async (req, res) => {
    try {
        // Because 'requireAuth' ran first, req.user holds the decoded token metrics.
        // We do a fast lookup to grab the absolute most-recent data (in case they updated their name or were banned).
        const userResult = await db.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'User no longer exists' });
        }

        res.json({ user: userResult.rows[0] });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Internal server error handling verification' });
    }
});

// ------------------------------------------------------------------
// POST /api/auth/logout
// ------------------------------------------------------------------
router.post('/logout', (req, res) => {
    // JWT architectures are stateless. The server doesn't hold an active connection instance.
    // Real logout entails the frontend completely discarding the physical token stored in the browser.
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
