const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'samerhassan11',
  database: process.env.DB_NAME || 'rayyan'
};

async function checkTransactions() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Check if transactions table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'transactions'");
    if (tables.length === 0) {
      console.log('❌ Transactions table does not exist');
      return;
    }

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE transactions');
    console.log('Transactions table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    // Check data count
    const [count] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
    console.log(`\nTransactions count: ${count[0].count}`);

    if (count[0].count > 0) {
      const [sample] = await connection.execute('SELECT * FROM transactions LIMIT 1');
      console.log('\nSample transaction:');
      console.log(sample[0]);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTransactions();