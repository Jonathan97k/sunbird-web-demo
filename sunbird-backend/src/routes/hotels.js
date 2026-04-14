const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET /api/hotels
router.get('/', async (req, res) => {
    try {
        // Extract basic query filters, establishing pagination defaults
        const { page = 1, limit = 10, category, city } = req.query;
        const offset = (page - 1) * limit;

        // Dynamically build filtering query clauses to ensure SQL-injection prevention
        let queryParams = [];
        let whereClauses = ['published = true'];

        if (category) {
            queryParams.push(category);
            whereClauses.push(`category = $${queryParams.length}`);
        }

        if (city) {
            queryParams.push(city);
            whereClauses.push(`city = $${queryParams.length}`);
        }

        const whereString = `WHERE ${whereClauses.join(' AND ')}`;
        
        // Add absolute limit and offset to query block end
        queryParams.push(parseInt(limit));
        const limitIndex = queryParams.length;
        queryParams.push(parseInt(offset));
        const offsetIndex = queryParams.length;

        // Execute primary base Hotel read
        const hotelsQuery = `
            SELECT * FROM hotels 
            ${whereString} 
            ORDER BY created_at DESC
            LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;
        
        const hotelsResult = await db.query(hotelsQuery, queryParams);
        const hotels = hotelsResult.rows;

        // Skip subsequent queries if absolutely no matched datasets
        if (hotels.length === 0) {
            return res.status(200).json({ hotels: [], page: Number(page), limit: Number(limit) });
        }

        // Fetch corresponding active rooms in a single unified secondary database hit 
        // to prevent traditional N+1 Query massive performance bottlenecks
        const hotelIds = hotels.map(h => h.id);
        const roomsResult = await db.query(
            `SELECT * FROM rooms WHERE hotel_id = ANY($1) AND available = true`, 
            [hotelIds]
        );

        // Bind decoupled database rooms strictly to matching parental hotel structures
        const hotelsWithRooms = hotels.map(hotel => {
            return {
                ...hotel,
                rooms: roomsResult.rows.filter(r => r.hotel_id === hotel.id)
            };
        });

        res.status(200).json({ 
            hotels: hotelsWithRooms, 
            page: Number(page), 
            limit: Number(limit), 
            total_returned: hotelsWithRooms.length 
        });

    } catch (error) {
        console.error('GET /api/hotels error:', error);
        res.status(500).json({ error: 'Internal server error fetching hotels.' });
    }
});

// GET /api/hotels/:slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const hotelResult = await db.query('SELECT * FROM hotels WHERE slug = $1', [slug]);

        if (hotelResult.rows.length === 0) {
            return res.status(404).json({ error: 'Hotel not found.' });
        }

        const hotel = hotelResult.rows[0];

        const roomsResult = await db.query('SELECT * FROM rooms WHERE hotel_id = $1', [hotel.id]);
        hotel.rooms = roomsResult.rows;

        res.status(200).json({ hotel });
    } catch (error) {
        console.error('GET /api/hotels/:slug error:', error);
        res.status(500).json({ error: 'Internal server error fetching hotel details.' });
    }
});

// GET /api/hotels/:slug/rooms
router.get('/:slug/rooms', async (req, res) => {
    try {
        const { slug } = req.params;
        
        // 1. Initial slug verification ensures hotel legitimately actively exists prior to room dumps
        const hotelResult = await db.query('SELECT id FROM hotels WHERE slug = $1', [slug]);

        if (hotelResult.rows.length === 0) {
            return res.status(404).json({ error: 'Hotel not found.' });
        }

        const hotelId = hotelResult.rows[0].id;

        // 2. Safely output strictly available entities 
        const roomsResult = await db.query('SELECT * FROM rooms WHERE hotel_id = $1 AND available = true', [hotelId]);

        res.status(200).json({ rooms: roomsResult.rows });
    } catch (error) {
        console.error('GET /api/hotels/:slug/rooms error:', error);
        res.status(500).json({ error: 'Internal server error fetching available rooms.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS (Requires valid JWT)
// ==========================================

// POST /api/hotels
router.post('/', requireAuth, async (req, res) => {
    try {
        const { slug, name, city, category, description, short_description, star_rating, image_gradient, published } = req.body;

        // Hard requirement validation checks prior to DB interactions
        if (!slug || !name || !city) {
            return res.status(400).json({ error: 'Missing required configuration fields: slug, name, and city.' });
        }

        const insertQuery = `
            INSERT INTO hotels (slug, name, city, category, description, short_description, star_rating, image_gradient, published)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        
        const values = [
            slug, name, city, category, description, short_description, 
            star_rating || 5, image_gradient, published !== undefined ? published : true
        ];

        const result = await db.query(insertQuery, values);
        res.status(201).json({ message: 'Hotel established successfully', hotel: result.rows[0] });

    } catch (error) {
        console.error('POST /api/hotels error:', error);
        
        // Custom handler cleanly intercepts Postgres error 23505 (Unique Identifier Violation Exists)
        if (error.code === '23505') { 
            return res.status(400).json({ error: 'A hotel utilizing this exact identical slug handle already extensively exists.' });
        }
        res.status(500).json({ error: 'Internal server error actively creating hotel record.' });
    }
});

// PUT /api/hotels/:id
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Validation rejected: Request object contained completely empty variable components.' });
        }

        // Pure white-list methodology actively guards against intentional internal injection exploits
        const allowedFields = ['slug', 'name', 'city', 'category', 'description', 'short_description', 'star_rating', 'image_gradient', 'published'];
        
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

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'Update rejected: No externally valid schema fields located within active payload parameters.' });
        }

        // Automatic timestamp alignment explicitly injected server-side independently 
        setClauses.push(`updated_at = NOW()`);
        
        values.push(id);
        const query = `
            UPDATE hotels 
            SET ${setClauses.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *;
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Resource absent: Attempted target database hotel handle definitively unlocatable.' });
        }

        res.status(200).json({ message: 'Hotel accurately structurally updated', hotel: result.rows[0] });

    } catch (error) {
        console.error('PUT /api/hotels/:id error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Slug conflict globally detected. Value utilized by external existing database records.' });
        }
        res.status(500).json({ error: 'Internal server error structurally executing overarching backend hardware components.' });
    }
});

// DELETE /api/hotels/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Our database schema natively supports ON DELETE CASCADE. 
        // Wiping out the hotel globally natively internally forcefully cleans up all linked rooms and bookings.
        const result = await db.query('DELETE FROM hotels WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Target hotel unlocatable natively within existing external datasets.' });
        }

        res.status(200).json({ success: true, message: 'Hotel globally stripped and corresponding regional rooms natively scrubbed flawlessly.' });

    } catch (error) {
        console.error('DELETE /api/hotels/:id error:', error);
        res.status(500).json({ error: 'System internal failure natively scrubbing physical database instances.' });
    }
});

// PATCH /api/hotels/:id/publish
router.patch('/:id/publish', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Toggle the explicit boolean globally using Postgres native 'NOT' syntax. Fast, accurate, explicitly robust.
        const query = `
            UPDATE hotels 
            SET published = NOT published, updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hotel query natively formally failed. Explicit ID invalidly mapped inside database logic.' });
        }

        const newStatus = result.rows[0].published;
        res.status(200).json({ 
            message: `External publication architecture effectively updated successfully to global formally integrated state: ${newStatus ? 'Activated' : 'Suspended'}`, 
            hotel: result.rows[0] 
        });

    } catch (error) {
        console.error('PATCH /api/hotels/:id/publish error:', error);
        res.status(500).json({ error: 'Internal failure effectively securely bridging targeted schema values.' });
    }
});

module.exports = router;
