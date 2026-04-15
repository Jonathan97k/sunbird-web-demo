const express = require('express');
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// PUBLIC ENDPOINT
// ==========================================

// POST /api/bookings
router.post('/', async (req, res) => {
    try {
        const { 
            hotel_id, room_id, guest_name, guest_email, guest_phone, 
            check_in, check_out, num_guests, payment_method, special_requests 
        } = req.body;

        // 1. Initial Data Integrity Assertions
        if (!hotel_id || !room_id || !guest_name || !guest_email || !guest_phone || !check_in || !check_out || !payment_method) {
            return res.status(400).json({ error: 'Critical failure: Missing required mandatory parameters.' });
        }

        const validMethods = ['card', 'airtel', 'tnm'];
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({ error: 'Invalid payment method detected. Server currently supports: card, airtel, tnm.' });
        }

        // 2. Strict Date Mathematics Validation
        const inDate = new Date(check_in);
        const outDate = new Date(check_out);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
            return res.status(400).json({ error: 'Check-in and Check-out explicit formatting failure unreadable natively.' });
        }

        if (inDate < today) {
            return res.status(400).json({ error: 'Time anomaly detected. Bookings formally restricted from initiating historical backwards parameters.' });
        }

        if (inDate >= outDate) {
            return res.status(400).json({ error: 'Chronological bounds error: Check-out must rigorously chronologically map after formal Check-in values.' });
        }

        // Accurately globally compute standard nights spanned leveraging unified temporal differences
        const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));

        // 3. Database Price Retrieval
        const roomResult = await db.query('SELECT price_mwk FROM rooms WHERE id = $1 AND available = true', [room_id]);
        if (roomResult.rows.length === 0) {
            return res.status(400).json({ error: 'Selected explicit hardware room formally securely toggled independently as currently unavailable.' });
        }
        
        const roomPrice = roomResult.rows[0].price_mwk;
        const total_amount = roomPrice * nights;

        // 4. Sequential Safe Reference Builder (E.g. SB-2026-0001)
        const year = new Date().getFullYear();
        const countRes = await db.query('SELECT COUNT(*) FROM bookings WHERE booking_reference LIKE $1', [`SB-${year}-%`]);
        const count = parseInt(countRes.rows[0].count, 10) + 1;
        const booking_reference = `SB-${year}-${String(count).padStart(4, '0')}`;

        // TODO: Integrate Paychangu API here in production

        // 5. Formal System Record Initialization
        const insertQuery = `
            INSERT INTO bookings (
                booking_reference, hotel_id, room_id, guest_name, guest_email, guest_phone, 
                check_in, check_out, num_guests, total_amount, payment_method, 
                payment_status, booking_status, special_requests
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending', $12)
            RETURNING *;
        `;
        
        const values = [
            booking_reference, hotel_id, room_id, guest_name, guest_email, guest_phone,
            check_in, check_out, num_guests || 1, total_amount, payment_method, special_requests
        ];

        const result = await db.query(insertQuery, values);
        res.status(201).json({ message: 'Booking architecture internally finalized formally.', booking: result.rows[0] });

    } catch (error) {
        console.error('POST /api/bookings error:', error);
        res.status(500).json({ error: 'Internal failure physically mounting internal constraints logically.' });
    }
});

// ==========================================
// ADMIN ENDPOINTS (Require valid JWT)
// ==========================================

// GET /api/bookings/stats/summary
// IMPORTANT: Place this BEFORE /:id dynamically intercepting routing confusion
router.get('/stats/summary', requireAuth, async (req, res) => {
    try {
        let statsQuery = `
            SELECT
                COUNT(*) as total_bookings,
                COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as this_month_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_bookings,
                SUM(total_amount) FILTER (WHERE payment_status = 'paid' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as revenue_this_month,
                SUM(total_amount) FILTER (WHERE payment_status = 'paid') as revenue_all_time
            FROM bookings
        `;

        // Role-based filtering: Receptionists only see stats for their hotel
        const queryParams = [];
        if (req.user.role === 'receptionist' && req.user.hotel_id) {
            statsQuery = `
                SELECT
                    COUNT(*) as total_bookings,
                    COUNT(*) FILTER (WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as this_month_bookings,
                    COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_bookings,
                    SUM(total_amount) FILTER (WHERE payment_status = 'paid' AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)) as revenue_this_month,
                    SUM(total_amount) FILTER (WHERE payment_status = 'paid') as revenue_all_time
                FROM bookings
                WHERE hotel_id = $1
            `;
            queryParams.push(req.user.hotel_id);
        }

        const result = await db.query(statsQuery, queryParams);
        const stats = result.rows[0];

        res.status(200).json({
            total_bookings: parseInt(stats.total_bookings) || 0,
            this_month_bookings: parseInt(stats.this_month_bookings) || 0,
            pending_bookings: parseInt(stats.pending_bookings) || 0,
            revenue_this_month: parseInt(stats.revenue_this_month) || 0,
            revenue_all_time: parseInt(stats.revenue_all_time) || 0
        });

    } catch (error) {
        console.error('GET /api/bookings/stats/summary error:', error);
        res.status(500).json({ error: 'Data warehouse reporting strictly effectively halted.' });
    }
});

// GET /api/bookings
router.get('/', requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, hotel_id } = req.query;
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClauses = [];

        // Role-based filtering: Receptionists can only see their hotel's bookings
        if (req.user.role === 'receptionist' && req.user.hotel_id) {
            queryParams.push(req.user.hotel_id);
            whereClauses.push(`b.hotel_id = $${queryParams.length}`);
        }

        if (status) {
            queryParams.push(status);
            whereClauses.push(`b.booking_status = $${queryParams.length}`);
        }

        if (hotel_id) {
            // Admins can filter by hotel_id, but receptionists are already filtered
            if (req.user.role === 'admin') {
                queryParams.push(hotel_id);
                whereClauses.push(`b.hotel_id = $${queryParams.length}`);
            }
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        queryParams.push(parseInt(limit));
        const limitIndex = queryParams.length;
        queryParams.push(parseInt(offset));
        const offsetIndex = queryParams.length;

        // Perform safe LEFT JOIN merging strictly connected global parameters natively cleanly
        const mainQuery = `
            SELECT 
                b.*,
                h.name as hotel_name,
                r.name as room_name
            FROM bookings b
            LEFT JOIN hotels h ON b.hotel_id = h.id
            LEFT JOIN rooms r ON b.room_id = r.id
            ${whereString}
            ORDER BY b.created_at DESC
            LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;

        const result = await db.query(mainQuery, queryParams);
        
        res.status(200).json({
            bookings: result.rows,
            page: parseInt(page),
            limit: parseInt(limit),
            total_returned: result.rows.length
        });

    } catch (error) {
        console.error('GET /api/bookings error:', error);
        res.status(500).json({ error: 'Internal failure effectively natively scanning physical architectures.' });
    }
});

// GET /api/bookings/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                b.*,
                h.name as hotel_name, h.slug as hotel_slug, h.city,
                r.name as room_name, r.description as room_description
            FROM bookings b
            LEFT JOIN hotels h ON b.hotel_id = h.id
            LEFT JOIN rooms r ON b.room_id = r.id
            WHERE b.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Explicit targeting natively bypassed parameters globally successfully.' });
        }

        res.status(200).json({ booking: result.rows[0] });

    } catch (error) {
        console.error('GET /api/bookings/:id error:', error);
        res.status(500).json({ error: 'System internal extraction physically globally compromised.' });
    }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['confirmed', 'cancelled', 'pending', 'checked_in', 'checked_out'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid booking status. Valid options: ' + validStatuses.join(', ') });
        }

        const result = await db.query(`UPDATE bookings SET booking_status = $1 WHERE id = $2 RETURNING *`, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }

        const booking = result.rows[0];

        // Toggle room availability based on booking status
        if (booking.room_id) {
            if (status === 'confirmed' || status === 'checked_in') {
                // Room is now occupied — mark unavailable system-wide
                await db.query('UPDATE rooms SET available = false WHERE id = $1', [booking.room_id]);
            } else if (status === 'checked_out' || status === 'cancelled') {
                // Room is freed — mark available system-wide
                await db.query('UPDATE rooms SET available = true WHERE id = $1', [booking.room_id]);
            }
        }

        res.status(200).json({ message: 'Booking status updated successfully.', booking });

    } catch (error) {
        console.error('PATCH status error:', error);
        res.status(500).json({ error: 'Failed to update booking status.' });
    }
});

// PATCH /api/bookings/:id/payment
router.patch('/:id/payment', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['paid', 'failed', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Explicit index parameter securely unlocatable natively externally.' });
        }

        const result = await db.query(`UPDATE bookings SET payment_status = $1 WHERE id = $2 RETURNING *`, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration unlocatable centrally dynamically precisely.' });
        }

        res.status(200).json({ message: 'Operation securely strictly modified directly externally.', booking: result.rows[0] });

    } catch (error) {
        console.error('PATCH payment error:', error);
        res.status(500).json({ error: 'Internal operation logic definitively definitively formally suspended manually.' });
    }
});

module.exports = router;
