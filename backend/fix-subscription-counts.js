const pool = require('./config/database');

async function fixSubscriptionCounts() {
  try {
    console.log('🎯 Fixing subscription counts to match target...\n');
    
    // Target: 21 total, 16 active, 3 cancelled, 2 past_due
    
    // Delete excess subscriptions, keeping the most recent ones
    console.log('1. Removing excess subscriptions...');
    
    // Keep only 21 subscriptions total
    await pool.query(`
      DELETE FROM subscriptions 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM subscriptions 
          ORDER BY created_at DESC 
          LIMIT 21
        ) as temp
      )
    `);
    
    // Update statuses to match target distribution
    console.log('2. Adjusting status distribution...');
    
    // Set first 16 to active
    await pool.query(`
      UPDATE subscriptions 
      SET status = 'active' 
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM subscriptions 
          ORDER BY created_at DESC 
          LIMIT 16
        ) as temp
      )
    `);
    
    // Set next 3 to cancelled
    await pool.query(`
      UPDATE subscriptions 
      SET status = 'cancelled' 
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM subscriptions 
          ORDER BY created_at DESC 
          LIMIT 3 OFFSET 16
        ) as temp
      )
    `);
    
    // Set last 2 to past_due
    await pool.query(`
      UPDATE subscriptions 
      SET status = 'past_due' 
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM subscriptions 
          ORDER BY created_at DESC 
          LIMIT 2 OFFSET 19
        ) as temp
      )
    `);
    
    // Final verification
    console.log('\n📊 Final verification:');
    const [finalCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due
      FROM subscriptions
    `);
    
    console.log(`✅ Total: ${finalCounts[0].total} (target: 21)`);
    console.log(`✅ Active: ${finalCounts[0].active} (target: 16)`);
    console.log(`✅ Cancelled: ${finalCounts[0].cancelled} (target: 3)`);
    console.log(`✅ Past Due: ${finalCounts[0].past_due} (target: 2)`);
    
    // Plan distribution
    console.log('\n📈 Plan distribution:');
    const [planDist] = await pool.query(`
      SELECT p.name, 
             COUNT(s.id) as total,
             SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active,
             ROUND((SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) * 100.0 / 16), 0) as percentage
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name
      HAVING COUNT(s.id) > 0
      ORDER BY active DESC
    `);
    
    planDist.forEach(row => {
      console.log(`- ${row.name}: ${row.active} active (${row.percentage}%) / ${row.total} total`);
    });
    
    console.log('\n🎉 Subscription counts fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixSubscriptionCounts();