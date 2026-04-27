const pool = require('./config/database');

async function checkPlans() {
  try {
    const [rows] = await pool.execute('SELECT * FROM plans');
    console.log('Current Plans in Database:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error checking plans:', error);
    process.exit(1);
  }
}

checkPlans();
