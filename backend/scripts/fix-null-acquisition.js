const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function fixNullAcquisition() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check for users with NULL acquisition_source
    const [nullUsers] = await connection.execute(`
      SELECT id, username, acquisition_source 
      FROM users 
      WHERE role = 'user' AND acquisition_source IS NULL
    `);

    console.log(`Found ${nullUsers.length} users with NULL acquisition_source`);

    // Update NULL acquisition_source to 'direct'
    if (nullUsers.length > 0) {
      await connection.execute(`
        UPDATE users 
        SET acquisition_source = 'direct' 
        WHERE role = 'user' AND acquisition_source IS NULL
      `);
      
      console.log(`✅ Updated ${nullUsers.length} users to have 'direct' acquisition_source`);
    }

    // Show current distribution
    const [distribution] = await connection.execute(`
      SELECT 
        COALESCE(acquisition_source, 'direct') as source,
        COUNT(*) as count
      FROM users 
      WHERE role = 'user'
      GROUP BY COALESCE(acquisition_source, 'direct')
      ORDER BY count DESC
    `);

    console.log('\n📊 Current User Acquisition Distribution:');
    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    distribution.forEach(item => {
      const percentage = Math.round((item.count / total) * 100);
      console.log(`   ${item.source}: ${item.count} users (${percentage}%)`);
    });
    
    console.log(`\n📋 Total Users: ${total}`);

  } catch (error) {
    console.error('❌ Error fixing acquisition sources:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixNullAcquisition();