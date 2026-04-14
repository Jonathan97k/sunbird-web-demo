const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINT
// ==========================================

// GET /api/offers
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                o.*,
                h.name as hotel_name
            FROM offers o
            LEFT JOIN hotels h ON o.hotel_id = h.id
            WHERE o.active = true AND o.valid_until >= CURRENT_DATE
            ORDER BY o.valid_until ASC
        `;

        const result = await db.query(query);
        res.status(200).json({ offers: result.rows });

    } catch (error) {
        console.error('GET /api/offers error:', error);
        res.status(500).json({ error: 'Internal server error fetching active offers.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS (Require Auth)
// ==========================================

// POST /api/offers
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, description, discount_percent, price_from_mwk, hotel_id, valid_from, valid_until, active } = req.body;

        if (!title || !valid_until) {
            return res.status(400).json({ error: 'Title and valid_until date are mandatory.' });
        }

        const query = `
            INSERT INTO offers (title, description, discount_percent, price_from_mwk, hotel_id, valid_from, valid_until, active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [title, description, discount_percent || 0, price_from_mwk || 0, hotel_id || null, valid_from || null, valid_until, active !== undefined ? active : true];

        const result = await db.query(query, values);
        res.status(201).json({ message: 'Offer created successfully.', offer: result.rows[0] });

    } catch (error) {
        console.error('POST /api/offers error:', error);
        res.status(500).json({ error: 'Internal server error creating offer.' });
    }
});

// PUT /api/offers/:id
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No update parameters provided.' });
        }

        const allowedFields = ['title', 'description', 'discount_percent', 'price_from_mwk', 'hotel_id', 'valid_from', 'valid_until', 'active'];
        const setClauses = [];
        const values = [];
        
        let paramIndex = 1;
        for (const key in updates) {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        }

        if (setClauses.length === 0) return res.status(400).json({ error: 'No valid update parameters provided.' });
        
        values.push(id);
        const query = `
            UPDATE offers 
            SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *;
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found.' });

        res.status(200).json({ message: 'Offer successfully updated.', offer: result.rows[0] });

    } catch (error) {
        console.error('PUT /api/offers/:id error:', error);
        res.status(500).json({ error: 'Internal server error updating offer.' });
    }
});

// DELETE /api/offers/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM offers WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found.' });

        res.status(200).json({ success: true, message: 'Offer permanently deleted.' });

    } catch (error) {
        console.error('DELETE /api/offers/:id error:', error);
        res.status(500).json({ error: 'Internal server error deleting offer.' });
    }
});

module.exports = router;
