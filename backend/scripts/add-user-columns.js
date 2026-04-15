const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function addUserColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Add missing columns to users table if they don't exist
    const columnsToAdd = [
      'ADD COLUMN job_title VARCHAR(100)',
      'ADD COLUMN bio TEXT',
      'ADD COLUMN acquisition_source ENUM("direct", "referral", "social", "other") DEFAULT "direct"',
      'ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE'
    ];

    for (const column of columnsToAdd) {
      try {
        await connection.execute(`ALTER TABLE users ${column}`);
        console.log(`✅ Added column: ${column}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Column already exists: ${column}`);
        } else {
          console.error(`❌ Error adding column ${column}:`, error.message);
        }
      }
    }

    console.log('✅ User columns update completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addUserColumns();