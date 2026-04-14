const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ==========================================
// 1. ROUTE IMPORTS
// ==========================================
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const enquiryRoutes = require('./routes/enquiries');
const offerRoutes = require('./routes/offers');
const newsletterRoutes = require('./routes/newsletter');

const app = express();

// ==========================================
// 2. MIDDLEWARE PIPELINE
// ==========================================

// Enable Cross-Origin Resource Sharing for all origins (demo mode)
app.use(cors());

// Parse incoming JSON payload bodies seamlessly
app.use(express.json());

// Request Logging Middleware: Output the explicit method and access path
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ==========================================
// 3. HEALTH CHECK ENDPOINT
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Sunbird Tourism API",
        version: "1.0.0",
        endpoints: [
            '/api/auth',
            '/api/hotels',
            '/api/bookings',
            '/api/enquiries',
            '/api/offers',
            '/api/newsletter'
        ]
    });
});

// ==========================================
// 4. API ROUTE MOUNTING
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/newsletter', newsletterRoutes);

// ==========================================
// 5. TERMINAL ERROR HANDLERS
// ==========================================

// 404 Catcher: If traffic hits an unknown URL route, fallback here
app.use((req, res, next) => {
    res.status(404).json({ error: '404 Exclusively Not Found: Target Endpoint Invalid.' });
});

// Global Error Catcher: Ensures unhandled logical crashes don't crash Express internally
app.use((err, req, res, next) => {
    console.error('🔥 Severe Unhandled Internal Logic Error:', err.stack);
    res.status(500).json({ error: '500 Server Exception: Internal structural logic failure.' });
});

// ==========================================
// 6. SERVER INITIALIZATION 
// ==========================================
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
    console.log(`
    🌅 SUNBIRD TOURISM API
    ====================
    🚀 Server running on port ${PORT}
    📝 Environment: ${ENV}
    🔗 API: http://localhost:${PORT}/api
    `);
});
