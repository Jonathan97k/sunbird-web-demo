-- src/database/schema.sql
-- Sunbird Hotels & Resorts Database Schema

-- Drop tables if they exist to allow clean recreation
-- Drop in reverse order of dependencies to handle foreign keys
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

-- 1. users table (created without hotel_id constraint first)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    hotel_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. hotels table
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., "capital", "nkopola"
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- city, lakeside, mountain
    description TEXT,
    short_description TEXT,
    star_rating INTEGER DEFAULT 5,
    image_gradient VARCHAR(255),
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to users table after hotels exists
ALTER TABLE users ADD CONSTRAINT users_hotel_id_fkey FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL;

-- 3. rooms table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., Standard, Deluxe, Suite
    price_mwk INTEGER NOT NULL,
    description TEXT,
    max_guests INTEGER DEFAULT 2,
    amenities TEXT[],
    available BOOLEAN DEFAULT true
);

-- 4. bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL, -- e.g., SB-2026-0001
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_guests INTEGER DEFAULT 1,
    total_amount INTEGER NOT NULL,
    payment_method VARCHAR(50), -- card, airtel, tnm
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
    booking_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. enquiries table
CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE SET NULL,
    enquiry_type VARCHAR(50), -- general, event, booking
    event_type VARCHAR(100),
    event_date DATE,
    num_delegates INTEGER,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. offers table
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent INTEGER,
    price_from_mwk INTEGER,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    valid_from DATE,
    valid_until DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. newsletter_subscribers table
CREATE TABLE newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscribed_at TIMESTAMP DEFAULT NOW()
);
