const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAdmin() {
  console.log('🔍 Checking admin user...');
  
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
      
      // Check admin users
      connection.query('SELECT id, username, email, role, status FROM users WHERE role = "admin"', (err, results) => {
        if (err) {
          console.error('❌ Failed to query admin users:', err.message);
          connection.end();
          reject(err);
          return;
        }
        
        console.log('\n📋 Admin users found:');
        if (results.length === 0) {
          console.log('   ❌ No admin users found!');
        } else {
          results.forEach(user => {
            console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Status: ${user.status}`);
          });
        }
        
        // Check if admin@rayyan.com exists
        connection.query('SELECT * FROM users WHERE email = "admin@rayyan.com"', async (err, adminResults) => {
          connection.end();
          
          if (err) {
            console.error('❌ Failed to check admin@rayyan.com:', err.message);
            reject(err);
            return;
          }
          
          if (adminResults.length === 0) {
            console.log('\n❌ admin@rayyan.com not found!');
            console.log('🔧 Need to create admin user');
          } else {
            const admin = adminResults[0];
            console.log('\n✅ admin@rayyan.com found:');
            console.log(`   - ID: ${admin.id}`);
            console.log(`   - Username: ${admin.username}`);
            console.log(`   - Email: ${admin.email}`);
            console.log(`   - Role: ${admin.role}`);
            console.log(`   - Status: ${admin.status}`);
            
            // Test password
            try {
              const isValidPassword = await bcrypt.compare('password', admin.password);
              console.log(`   - Password 'password' valid: ${isValidPassword ? '✅' : '❌'}`);
            } catch (error) {
              console.log(`   - Password check failed: ${error.message}`);
            }
          }
          
          resolve();
        });
      });
    });
  });
}

checkAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));