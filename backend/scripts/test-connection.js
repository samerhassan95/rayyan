const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📋 Configuration:');
  console.log('   Host:', process.env.DB_HOST || 'localhost');
  console.log('   Port:', process.env.DB_PORT || 3307);
  console.log('   User:', process.env.DB_USER || 'rayyan');
  console.log('   Database:', process.env.DB_NAME || 'rayyan_db');
  console.log('');

  let connection;
  
  try {
    // Test connection to MySQL server
    console.log('📡 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'samerhassan11'
    });
    
    console.log('✅ Connected to MySQL server successfully!');
    
    // Test database existence
    console.log('🗄️  Checking database...');
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME || 'rayyan']);
    
    if (databases.length === 0) {
      console.log('❌ Database does not exist');
      console.log('💡 Run: npm run setup-db');
      process.exit(1);
    }
    
    console.log('✅ Database exists');
    
    // Switch to database and check tables
    await connection.execute(`USE ${process.env.DB_NAME || 'rayyan'}`);
    console.log('📋 Checking tables...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables found:', tables.map(t => Object.values(t)[0]).join(', '));
    
    // Check if admin user exists
    const [users] = await connection.execute('SELECT * FROM users WHERE role = "admin"');
    console.log('👤 Admin users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No admin user found');
      console.log('💡 Run: npm run create-admin');
    } else {
      console.log('✅ Admin user exists:', users[0].email);
    }
    
    console.log('');
    console.log('🎉 Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL server is not running or not accessible on port 3307');
      console.log('💡 Make sure MySQL is running: brew services start mysql (Mac) or service mysql start (Linux)');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Access denied. Check your MySQL credentials:');
      console.log('   - Username: rayyan');
      console.log('   - Password: samerhassan11');
      console.log('   - Port: 3307');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();