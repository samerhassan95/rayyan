const pool = require('./config/database');

async function testInsert() {
  try {
    const name = 'Test Plan ' + Date.now();
    const tier = 'TEST';
    const monthlyPrice = 9.99;
    const yearlyPrice = 99.99;
    const description = 'Test description';
    const features = ['Feature 1', 'Feature 2'];

    console.log('Inserting plan...');
    const [result] = await pool.execute(`
      INSERT INTO plans (name, tier, monthly_price, yearly_price, description, features) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, tier, monthlyPrice, yearlyPrice, description, JSON.stringify(features)]);

    console.log('Inserted ID:', result.insertId);

    const [rows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [result.insertId]);
    console.log('Inserted Row:', JSON.stringify(rows[0], null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error in testInsert:', error);
    process.exit(1);
  }
}

testInsert();
