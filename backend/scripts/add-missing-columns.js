const mysql = require('mysql2');
require('dotenv').config();

async function addMissingColumns() {
  console.log('🚀 Adding missing columns...');
  
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    database: process.env.DB_NAME || 'rayyan'
  });
  
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Connection failed:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database');
      
      const addColumns = [
        'ALTER TABLE users ADD COLUMN job_title VARCHAR(100)',
        'ALTER TABLE users ADD COLUMN bio TEXT',
        'ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE',
        'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL'
      ];
      
      let completed = 0;
      
      addColumns.forEach((sql, index) => {
        connection.query(sql, (err, results) => {
          if (err && !err.message.includes('Duplicate column name')) {
            console.error(`❌ Failed to add column ${index + 1}:`, err.message);
          } else {
            console.log(`✅ Added column ${index + 1}`);
          }
          
          completed++;
          if (completed === addColumns.length) {
            connection.end();
            console.log('✅ All missing columns added successfully!');
            resolve();
          }
        });
      });
    });
  });
}

addMissingColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));