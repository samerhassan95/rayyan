const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdmin() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'samerhassan11',
      database: process.env.DB_NAME || 'rayyan'
    });
    
    console.log('Connected to database successfully!');
    
    // Check if users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    if (tables.length === 0) {
      console.log('Users table does not exist. Please run the database schema first.');
      console.log('Run: mysql -h localhost -P 3307 -u rayyan -psamerhassan11 rayyan_db < sql/schema.sql');
      process.exit(1);
    }
    
    // Hash the password 'password'
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@rayyan.com']
    );
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists. Updating password...');
      await connection.execute(
        'UPDATE users SET password = ?, role = ? WHERE email = ?',
        [hashedPassword, 'admin', 'admin@rayyan.com']
      );
    } else {
      console.log('Creating new admin user...');
      await connection.execute(
        'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@rayyan.com', hashedPassword, 'admin', 'active']
      );
    }
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('📧 Email: admin@rayyan.com');
    console.log('🔑 Password: password');
    console.log('⚠️  Please change the password after first login.');
    console.log('🌐 Admin Dashboard: http://localhost:3000/admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure MySQL is running on port 3307');
      console.log('💡 Check your database credentials in .env file');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Database access denied. Check username/password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Database does not exist. Create it first:');
      console.log('   CREATE DATABASE rayyan_db;');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAdmin();