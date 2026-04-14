const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
    console.log('⏳ Starting database migration...\n');
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Execute all schema SQL statements
        await db.query(schemaSql);

        console.log('✅ Created users table');
        console.log('✅ Created hotels table');
        console.log('✅ Created rooms table');
        console.log('✅ Created bookings table');
        console.log('✅ Created enquiries table');
        console.log('✅ Created offers table');
        console.log('✅ Created newsletter_subscribers table');

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch(err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
