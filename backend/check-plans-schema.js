const pool = require('./config/database');

async function checkSchema() {
  try {
    const [rows] = await pool.execute('DESCRIBE plans');
    console.log('Plans Table Structure:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
