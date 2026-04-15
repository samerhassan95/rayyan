const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function checkUsersTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check sample data
    const [users] = await connection.execute('SELECT * FROM users LIMIT 1');
    console.log('\nSample user data:');
    console.log(users[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable();