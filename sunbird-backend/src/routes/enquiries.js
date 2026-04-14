const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINT
// ==========================================

// POST /api/enquiries
// Handles forms spanning everything from direct general questions to massive corporate event requests
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, hotel_id, enquiry_type, event_type, event_date, num_delegates, message } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'System rejected parameters: Name, email, and phone structure components are strictly mandatory.' });
        }

        const insertQuery = `
            INSERT INTO enquiries (name, email, phone, hotel_id, enquiry_type, event_type, event_date, num_delegates, message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id;
        `;
        
        await db.query(insertQuery, [
            name, email, phone, 
            hotel_id || null, enquiry_type || 'general', 
            event_type || null, event_date || null, num_delegates || null, message || null
        ]);

        res.status(201).json({ success: true, message: 'Your formal enquiry has been electronically submitted. Our team will contact you shortly.' });

    } catch (error) {
        console.error('POST /api/enquiries error:', error);
        res.status(500).json({ error: 'Internal server failure handling explicit incoming transmission logic.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS (Require valid JWT)
// ==========================================

// GET /api/enquiries
router.get('/', requireAuth, async (req, res) => {
    try {
        const { is_read } = req.query;
        let queryParams = [];
        let whereClause = '';

        if (is_read === 'false') {
            whereClause = 'WHERE e.is_read = false';
        }

        const query = `
            SELECT 
                e.*,
                h.name as hotel_name
            FROM enquiries e
            LEFT JOIN hotels h ON e.hotel_id = h.id
            ${whereClause}
            ORDER BY e.created_at DESC
        `;

        const result = await db.query(query);
        res.status(200).json({ enquiries: result.rows });

    } catch (error) {
        console.error('GET /api/enquiries error:', error);
        res.status(500).json({ error: 'System internal failure natively actively spanning formal physical read requests.' });
    }
});

// PATCH /api/enquiries/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`UPDATE enquiries SET is_read = true WHERE id = $1 RETURNING *`, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Explicit physical message definitively unlocatable dynamically.' });
        }

        res.status(200).json({ message: 'Internal explicitly marked correctly successfully.', enquiry: result.rows[0] });

    } catch (error) {
        console.error('PATCH read status error:', error);
        res.status(500).json({ error: 'Internal failure effectively physically overwriting structural configurations.' });
    }
});

// DELETE /api/enquiries/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM enquiries WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parameter inherently formally bypassed natively unlocatable instance.' });
        }

        res.status(200).json({ success: true, message: 'Message permanently natively physically deleted globally comprehensively.' });

    } catch (error) {
        console.error('DELETE /api/enquiries error:', error);
        res.status(500).json({ error: 'System physically blocked internally extracting natively physically logic parameters.' });
    }
});

module.exports = router;
