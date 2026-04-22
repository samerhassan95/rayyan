// Test database connection for friend's setup
const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Empty password as shown in their .env
  database: 'rayyan_db'
};

async function testConnection() {
  try {
    console.log('Testing connection with config:', {
      ...config,
      password: config.password ? '***' : '(empty)'
    });
    
    const connection = await mysql.createConnection(config);
    console.log('✓ Connected to database successfully!');
    
    // Test if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ Found ${tables.length} tables in database`);
    
    if (tables.length === 0) {
      console.log('\n⚠ WARNING: Database is empty! Need to import the SQL dump.');
      console.log('Steps to import:');
      console.log('1. Open phpMyAdmin (http://localhost/phpmyadmin)');
      console.log('2. Click on "rayyan_db" database on the left');
      console.log('3. Click "Import" tab');
      console.log('4. Choose file: dump-rayyan-202604221358.sql');
      console.log('5. Click "Go" button at the bottom');
    } else {
      console.log('\nTables found:');
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
      
      // Check for users
      const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n✓ Users in database: ${users[0].count}`);
      
      // Check for admin user
      const [admins] = await connection.query('SELECT * FROM users WHERE role = "admin" LIMIT 1');
      if (admins.length > 0) {
        console.log(`✓ Admin user found: ${admins[0].email}`);
      } else {
        console.log('⚠ No admin user found! Need to create one.');
      }
    }
    
    await connection.end();
    console.log('\n✓ Connection test completed successfully!');
    
  } catch (error) {
    console.error('✗ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nPossible fixes:');
      console.log('1. Check DB_PASSWORD in backend/.env file');
      console.log('2. Make sure MySQL is running in XAMPP');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\nDatabase "rayyan_db" does not exist!');
      console.log('Create it in phpMyAdmin or run:');
      console.log('CREATE DATABASE rayyan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\nMySQL server is not running!');
      console.log('Start MySQL in XAMPP Control Panel');
    }
  }
}

testConnection();
