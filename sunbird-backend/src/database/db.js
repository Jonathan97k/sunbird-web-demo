const { Pool } = require('pg');
require('dotenv').config();

// Determine connection details. Neon and Supabase require SSL.
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const isCloudDB = connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('render.com');

const pool = new Pool({
  connectionString,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('🚀 Connected successfully to PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.stack);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
