const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function updateSchema() {
  console.log('🚀 Updating database schema...');
  
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'samerhassan11',
    database: process.env.DB_NAME || 'rayyan',
    multipleStatements: true
  });
  
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Connection failed:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ Connected to database');
      
      try {
        const schemaPath = path.join(__dirname, '../sql/enhanced-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        connection.query(schema, (err, results) => {
          connection.end();
          
          if (err) {
            console.error('❌ Schema update failed:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ Database schema updated successfully!');
          resolve();
        });
        
      } catch (readError) {
        console.error('❌ Failed to read schema file:', readError.message);
        connection.end();
        reject(readError);
      }
    });
  });
}

updateSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));