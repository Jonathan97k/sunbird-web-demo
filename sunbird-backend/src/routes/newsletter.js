const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINT
// ==========================================

// POST /api/newsletter
router.post('/', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Valid email strictly required.' });
        }

        // ON CONFLICT DO NOTHING gracefully absorbs duplicate emails without throwing an ugly 500 server error
        const query = `
            INSERT INTO newsletter_subscribers (email) 
            VALUES ($1) 
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `;
        
        await db.query(query, [email.toLowerCase()]);
        
        // Always returning success so frontend users aren't confused if they accidentally subscribe twice
        res.status(201).json({ success: true, message: 'Thank you! You have successfully subscribed to the Sunbird Newsletter.' });

    } catch (error) {
        console.error('POST /api/newsletter error:', error);
        res.status(500).json({ error: 'Internal server error processing newsletter subscription.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS (Require Auth)
// ==========================================

// GET /api/newsletter
router.get('/', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT * FROM newsletter_subscribers 
            ORDER BY subscribed_at DESC
        `;
        const result = await db.query(query);

        res.status(200).json({ subscribers: result.rows, total: result.rows.length });

    } catch (error) {
        console.error('GET /api/newsletter error:', error);
        res.status(500).json({ error: 'Internal server error fetching subscriber index.' });
    }
});

module.exports = router;
