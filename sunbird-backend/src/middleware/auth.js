const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        // Ensure header exists and matches the "Bearer <token>" format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
        }

        // Extract raw token
        const token = authHeader.split(' ')[1];

        // Verify the token strictly matching against the server's private secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Standardly attach the extracted user data to req.user for further controller use
        req.user = decoded;

        // Validation passed -> proceed to the actual route handler
        next();
    } catch (err) {
        // This fires if token is explicitly tampered with, unreadable, or successfully read but past its "expiresIn" date
        return res.status(401).json({ error: 'Unauthorized: Token is invalid or has expired' });
    }
}

module.exports = { requireAuth };
