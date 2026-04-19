const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'rayyan'
  });

  try {
    const [columns] = await connection.execute('DESCRIBE activity_log');
    console.log(JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

inspectTable();
