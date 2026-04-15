const pool = require('./config/database');

async function cleanPlansData() {
  try {
    console.log('🧹 Cleaning plans data...\n');
    
    // Delete invalid plans
    console.log('1. Deleting invalid plans...');
    await pool.query(`DELETE FROM plans WHERE name IN ('b', 'c') OR name IS NULL OR monthly_price IS NULL`);
    
    // Delete duplicate plans (keep only the first occurrence of each)
    console.log('2. Removing duplicate plans...');
    await pool.query(`
      DELETE p1 FROM plans p1
      INNER JOIN plans p2 
      WHERE p1.id > p2.id AND p1.name = p2.name
    `);
    
    // Update subscriptions that reference deleted plans to use the correct plan IDs
    console.log('3. Updating subscription references...');
    
    // Get the correct plan IDs
    const [correctPlans] = await pool.query(`
      SELECT id, name FROM plans 
      WHERE name IN ('Basic', 'Professional', 'Enterprise')
      ORDER BY id
    `);
    
    console.log('✅ Remaining plans:');
    correctPlans.forEach(plan => {
      console.log(`- ID: ${plan.id}, Name: ${plan.name}`);
    });
    
    // Update subscriptions to use correct plan IDs
    for (const plan of correctPlans) {
      await pool.query(`
        UPDATE subscriptions 
        SET plan_id = ? 
        WHERE plan_id IN (
          SELECT id FROM (
            SELECT id FROM plans WHERE name = ? AND id != ?
          ) as temp
        )
      `, [plan.id, plan.name, plan.id]);
    }
    
    // Verify the cleanup
    console.log('\n📊 Final verification:');
    const [finalCheck] = await pool.query(`
      SELECT p.name, COUNT(s.id) as total_subs,
             SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subs
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name
      ORDER BY p.name
    `);
    
    finalCheck.forEach(row => {
      console.log(`- ${row.name}: ${row.active_subs} active / ${row.total_subs} total subscriptions`);
    });
    
    console.log('\n🎉 Plans data cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanPlansData();