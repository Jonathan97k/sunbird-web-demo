const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('⏳ Starting dataset seeding...\n');
    try {
        // 1. Seed Admin User
        const adminHash = await bcrypt.hash('admin123', 10);
        await db.query(`
            INSERT INTO users (email, password_hash, full_name, role) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (email) DO NOTHING
        `, ['admin@sunbirdmalawi.com', adminHash, 'System Admin', 'admin']);
        console.log('✅ Seeded: admin user');

        // 2. Seed Hotels
        const hotels = [
            { slug: 'capital', name: 'Sunbird Capital Hotel', city: 'Lilongwe', category: 'city', short_desc: 'The heartbeat of the capital. Premium business and leisure.' },
            { slug: 'lilongwe', name: 'Sunbird Lilongwe Hotel', city: 'Lilongwe', category: 'city', short_desc: 'Contemporary comfort in Malawi\'s capital city.' },
            { slug: 'nkopola', name: 'Sunbird Nkopola Lodge', city: 'Mangochi', category: 'lakeside', short_desc: 'Lakeside paradise on the shores of Lake Malawi.' },
            { slug: 'livingstonia', name: 'Sunbird Livingstonia Beach', city: 'Salima', category: 'lakeside', short_desc: 'White sand beaches. Crystal clear lake waters. Pure bliss.' },
            { slug: 'mzuzu', name: 'Sunbird Mzuzu Hotel', city: 'Mzuzu', category: 'city', short_desc: 'Your northern gateway — refined and welcoming.' },
            { slug: 'soche', name: 'Sunbird Mount Soche', city: 'Blantyre', category: 'city', short_desc: 'Blantyre\'s landmark hotel since 1966. Timeless elegance.' },
            { slug: 'kuchawe', name: 'Sunbird Ku Chawe', city: 'Zomba', category: 'mountain', short_desc: 'Perched on the Zomba Plateau. Cool mountain air and breathtaking views.' },
            { slug: 'ryalls', name: 'Sunbird Ryalls Hotel', city: 'Blantyre', category: 'city', short_desc: 'Colonial charm meets modern luxury in the commercial capital.' },
            { slug: 'makokola', name: 'Sunbird Club Makokola', city: 'Mangochi', category: 'lakeside', short_desc: 'Malawi\'s most celebrated beach resort. All-inclusive luxury.' }
        ];

        for (const h of hotels) {
            await db.query(`
                INSERT INTO hotels (slug, name, city, category, short_description) 
                VALUES ($1, $2, $3, $4, $5) 
                ON CONFLICT (slug) DO NOTHING
            `, [h.slug, h.name, h.city, h.category, h.short_desc]);
        }
        console.log('✅ Seeded: 9 Sunbird hotels');

        // 3. Seed Rooms per Hotel
        const dbHotels = await db.query('SELECT id FROM hotels');
        await db.query('DELETE FROM rooms'); // Clear any existing to avoid massive duplicate build ups if run multiple times
        for (const h of dbHotels.rows) {
            await db.query(`
                INSERT INTO rooms (hotel_id, name, price_mwk, description, max_guests, amenities) VALUES 
                ($1, 'Standard Room', 85000, 'Comfortable room with essential amenities.', 2, ARRAY['WiFi', 'TV', 'Air Conditioning']),
                ($1, 'Deluxe Room', 130000, 'Spacious room with a beautiful view and premium perks.', 2, ARRAY['WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Bathtub']),
                ($1, 'Suite', 220000, 'Luxury suite with a living area and exclusive services.', 4, ARRAY['WiFi', 'TV', 'Air Conditioning', 'Mini Fridge', 'Bathtub', 'Lounge Area']);
            `, [h.id]);
        }
        console.log('✅ Seeded: 3 Rooms per hotel (' + (dbHotels.rows.length * 3) + ' total)');

        // 4. Seed Offers
        await db.query('DELETE FROM offers'); 
        await db.query(`
            INSERT INTO offers (title, description, discount_percent, price_from_mwk, hotel_id, valid_from, valid_until) VALUES
            ('Romantic Weekend', 'Romantic suite setup with complimentary champagne and spa access.', 10, 200000, (SELECT id FROM hotels WHERE slug='kuchawe'), '2026-06-01', '2026-12-31'),
            ('Business Executive Package', 'Includes complimentary breakfast, high-speed Wi-Fi, and late checkout.', 15, 120000, (SELECT id FROM hotels WHERE slug='capital'), '2026-01-01', '2026-12-31'),
            ('Family Weekend Escape', 'Escape the city heat with our lakeside family weekend package.', 20, 110000, (SELECT id FROM hotels WHERE slug='nkopola'), '2026-05-01', '2026-12-31'),
            ('Festive Season Advance Booking', 'Book your December holiday early and save massively.', 25, 75000, NULL, '2026-11-01', '2027-01-15');
        `);
        console.log('✅ Seeded: 4 Special Offers');

        // 5. Seed Fake Bookings
        await db.query('DELETE FROM bookings');
        await db.query(`
            INSERT INTO bookings (booking_reference, hotel_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, num_guests, total_amount, payment_method, payment_status, booking_status) VALUES
            ('SB-2026-0001', (SELECT id FROM hotels WHERE slug='capital'), (SELECT id FROM rooms WHERE name='Standard Room' AND hotel_id=(SELECT id FROM hotels WHERE slug='capital')), 'John Banda', 'john.banda@example.com', '+265 888 123 456', '2026-05-10', '2026-05-12', 1, 170000, 'card', 'paid', 'confirmed'),
            ('SB-2026-0002', (SELECT id FROM hotels WHERE slug='nkopola'), (SELECT id FROM rooms WHERE name='Suite' AND hotel_id=(SELECT id FROM hotels WHERE slug='nkopola')), 'Sarah Phiri', 'sarah.phiri@example.com', '+265 999 987 654', '2026-06-05', '2026-06-10', 2, 1100000, 'airtel', 'paid', 'confirmed'),
            ('SB-2026-0003', (SELECT id FROM hotels WHERE slug='kuchawe'), (SELECT id FROM rooms WHERE name='Deluxe Room' AND hotel_id=(SELECT id FROM hotels WHERE slug='kuchawe')), 'Michael Chitedze', 'm.chitedze@example.com', '+265 881 223 344', '2026-05-20', '2026-05-22', 2, 260000, 'tnm', 'pending', 'pending'),
            ('SB-2026-0004', (SELECT id FROM hotels WHERE slug='mzuzu'), (SELECT id FROM rooms WHERE name='Standard Room' AND hotel_id=(SELECT id FROM hotels WHERE slug='mzuzu')), 'Grace Gondwe', 'grace.gondwe@example.com', '+265 992 334 455', '2026-07-01', '2026-07-03', 1, 170000, 'card', 'failed', 'cancelled'),
            ('SB-2026-0005', (SELECT id FROM hotels WHERE slug='soche'), (SELECT id FROM rooms WHERE name='Deluxe Room' AND hotel_id=(SELECT id FROM hotels WHERE slug='soche')), 'David Mwale', 'david.mwale@example.com', '+265 885 445 566', '2026-05-15', '2026-05-18', 2, 390000, 'airtel', 'paid', 'confirmed');
        `);
        console.log('✅ Seeded: 5 Fake Demo Bookings');

        console.log('\n🎉 Seeding completed successfully!');
        process.exit(0);

    } catch(err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
