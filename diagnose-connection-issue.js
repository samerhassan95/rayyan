// Comprehensive diagnostic script
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

console.log('=== RAYYAN DATABASE DIAGNOSTIC ===\n');

// Check 1: .env file location and content
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, 'backend', '.env');
console.log(`   Looking for: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('   Content:');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key === 'DB_PASSWORD') {
        console.log(`   ${key}=${value ? '***' : '(empty)'}`);
      } else {
        console.log(`   ${line}`);
      }
    }
  });
} else {
  console.log('   ✗ .env file NOT FOUND!');
  console.log('   Make sure .env is in the backend folder');
}

// Check 2: Load environment variables
console.log('\n2. Loading environment variables...');
require('dotenv').config({ path: envPath });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rayyan_db'
};

console.log('   Loaded config:');
console.log(`   DB_HOST: ${config.host}`);
console.log(`   DB_PORT: ${config.port}`);
console.log(`   DB_USER: ${config.user}`);
console.log(`   DB_PASSWORD: ${config.password ? '***' : '(empty)'}`);
console.log(`   DB_NAME: ${config.database}`);

// Check 3: Test connection
console.log('\n3. Testing database connection...');

async function diagnose() {
  try {
    // First try without database to check MySQL connection
    const testConfig = { ...config };
    delete testConfig.database;
    
    console.log('   Connecting to MySQL server...');
    const conn = await mysql.createConnection(testConfig);
    console.log('   ✓ MySQL server connection successful');
    
    // Check if database exists
    console.log(`\n4. Checking if database "${config.database}" exists...`);
    const [databases] = await conn.query('SHOW DATABASES');
    const dbExists = databases.some(db => Object.values(db)[0] === config.database);
    
    if (dbExists) {
      console.log(`   ✓ Database "${config.database}" exists`);
    } else {
      console.log(`   ✗ Database "${config.database}" NOT FOUND!`);
      console.log('   Available databases:');
      databases.forEach(db => console.log(`     - ${Object.values(db)[0]}`));
      await conn.end();
      return;
    }
    
    await conn.end();
    
    // Now connect to the specific database
    console.log(`\n5. Connecting to database "${config.database}"...`);
    const connection = await mysql.createConnection(config);
    console.log('   ✓ Connected successfully');
    
    // Check tables
    console.log('\n6. Checking tables...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`   Found ${tables.length} tables:`);
    
    if (tables.length === 0) {
      console.log('   ✗ NO TABLES FOUND! Database is empty.');
      console.log('   You need to import the SQL dump.');
    } else {
      tables.forEach(table => {
        console.log(`     - ${Object.values(table)[0]}`);
      });
    }
    
    // Check users table
    if (tables.length > 0) {
      console.log('\n7. Checking users table...');
      try {
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   ✓ Total users: ${users[0].count}`);
        
        const [admins] = await connection.query('SELECT id, username, email, role FROM users WHERE role = "admin"');
        console.log(`   ✓ Admin users: ${admins.length}`);
        if (admins.length > 0) {
          admins.forEach(admin => {
            console.log(`     - ${admin.username} (${admin.email})`);
          });
        }
        
        // Check subscriptions
        console.log('\n8. Checking subscriptions...');
        const [subs] = await connection.query('SELECT COUNT(*) as count FROM subscriptions');
        console.log(`   ✓ Total subscriptions: ${subs[0].count}`);
        
        // Check transactions
        console.log('\n9. Checking transactions...');
        const [trans] = await connection.query('SELECT COUNT(*) as count FROM transactions');
        console.log(`   ✓ Total transactions: ${trans[0].count}`);
        
        // Check plans
        console.log('\n10. Checking plans...');
        const [plans] = await connection.query('SELECT COUNT(*) as count FROM plans');
        console.log(`   ✓ Total plans: ${plans[0].count}`);
        
      } catch (err) {
        console.log(`   ✗ Error querying tables: ${err.message}`);
      }
    }
    
    await connection.end();
    
    console.log('\n=== DIAGNOSIS COMPLETE ===');
    console.log('\nIf all checks passed, the issue might be:');
    console.log('1. Backend server not restarted after .env changes');
    console.log('2. Frontend pointing to wrong backend URL');
    console.log('3. CORS issues blocking API calls');
    console.log('\nNext steps:');
    console.log('- Restart backend server (Ctrl+C then npm start)');
    console.log('- Check browser console (F12) for errors');
    console.log('- Check backend terminal for API request logs');
    
  } catch (error) {
    console.error('\n✗ CONNECTION FAILED!');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    
    console.log('\n=== TROUBLESHOOTING ===');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('MySQL is not running!');
      console.log('Solution: Start MySQL in XAMPP Control Panel');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Wrong username or password!');
      console.log('Solution: Check DB_USER and DB_PASSWORD in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`Database "${config.database}" does not exist!`);
      console.log('Solution: Create it in phpMyAdmin or change DB_NAME in .env');
    } else {
      console.log('Unknown error. Full error details:');
      console.error(error);
    }
  }
}

diagnose();
