const mysql = require('mysql2');
require('dotenv').config();

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
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
      
      // Check users table structure
      connection.query('DESCRIBE users', (err, results) => {
        if (err) {
          console.error('❌ Failed to describe users table:', err.message);
          connection.end();
          reject(err);
          return;
        }
        
        console.log('\n📋 Users table columns:');
        results.forEach(column => {
          console.log(`   - ${column.Field} (${column.Type})`);
        });
        
        // Check if plans table exists
        connection.query('SHOW TABLES LIKE "plans"', (err, results) => {
          if (err) {
            console.error('❌ Failed to check plans table:', err.message);
            connection.end();
            reject(err);
            return;
          }
          
          console.log(`\n📋 Plans table exists: ${results.length > 0 ? 'YES' : 'NO'}`);
          
          // Check if subscriptions table exists
          connection.query('SHOW TABLES LIKE "subscriptions"', (err, results) => {
            if (err) {
              console.error('❌ Failed to check subscriptions table:', err.message);
              connection.end();
              reject(err);
              return;
            }
            
            console.log(`📋 Subscriptions table exists: ${results.length > 0 ? 'YES' : 'NO'}`);
            
            // Check if transactions table exists
            connection.query('SHOW TABLES LIKE "transactions"', (err, results) => {
              connection.end();
              
              if (err) {
                console.error('❌ Failed to check transactions table:', err.message);
                reject(err);
                return;
              }
              
              console.log(`📋 Transactions table exists: ${results.length > 0 ? 'YES' : 'NO'}`);
              resolve();
            });
          });
        });
      });
    });
  });
}

checkSchema()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));