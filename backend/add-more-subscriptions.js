const pool = require('./config/database');

async function addMoreSubscriptions() {
  try {
    console.log('📈 Adding more subscriptions to reach target numbers...\n');
    
    // Get current counts
    const [currentCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM subscriptions
    `);
    
    console.log(`Current: ${currentCounts[0].active} active / ${currentCounts[0].total} total`);
    console.log('Target: 16 active / 21 total\n');
    
    // Get plan IDs
    const [plans] = await pool.query('SELECT id, name FROM plans ORDER BY id');
    const planMap = {};
    plans.forEach(plan => {
      planMap[plan.name] = plan.id;
    });
    
    // Get user IDs
    const [users] = await pool.query('SELECT id FROM users LIMIT 20');
    
    // Add more subscriptions to reach target
    const subscriptionsToAdd = [
      // More Basic subscriptions (target: ~13 active)
      { user_id: users[5]?.id || 1, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[6]?.id || 2, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'yearly' },
      { user_id: users[7]?.id || 3, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[8]?.id || 4, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[9]?.id || 5, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'yearly' },
      { user_id: users[10]?.id || 6, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[11]?.id || 7, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[12]?.id || 8, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[13]?.id || 9, plan_id: planMap['Basic'], status: 'active', billing_cycle: 'yearly' },
      { user_id: users[14]?.id || 10, plan_id: planMap['Basic'], status: 'cancelled', billing_cycle: 'monthly' },
      { user_id: users[15]?.id || 11, plan_id: planMap['Basic'], status: 'past_due', billing_cycle: 'monthly' },
      
      // More Professional subscriptions (target: ~6 active)
      { user_id: users[16]?.id || 12, plan_id: planMap['Professional'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[17]?.id || 13, plan_id: planMap['Professional'], status: 'active', billing_cycle: 'yearly' },
      { user_id: users[18]?.id || 14, plan_id: planMap['Professional'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[19]?.id || 15, plan_id: planMap['Professional'], status: 'active', billing_cycle: 'monthly' },
      { user_id: users[1]?.id || 16, plan_id: planMap['Professional'], status: 'cancelled', billing_cycle: 'monthly' },
      { user_id: users[2]?.id || 17, plan_id: planMap['Professional'], status: 'past_due', billing_cycle: 'yearly' },
      
      // More Enterprise subscriptions (target: ~3 active)
      { user_id: users[3]?.id || 18, plan_id: planMap['Enterprise'], status: 'active', billing_cycle: 'yearly' },
      { user_id: users[4]?.id || 19, plan_id: planMap['Enterprise'], status: 'active', billing_cycle: 'monthly' },
    ];
    
    console.log(`Adding ${subscriptionsToAdd.length} new subscriptions...`);
    
    for (const sub of subscriptionsToAdd) {
      const currentPeriodStart = new Date('2026-04-01');
      const currentPeriodEnd = sub.billing_cycle === 'monthly' ? 
        new Date('2026-05-01') : new Date('2027-04-01');
      const nextPaymentDate = sub.status === 'active' ? currentPeriodEnd : null;
      const amount = sub.billing_cycle === 'monthly' ? 
        (sub.plan_id === planMap['Basic'] ? 29 : sub.plan_id === planMap['Professional'] ? 79 : 249) :
        (sub.plan_id === planMap['Basic'] ? 290 : sub.plan_id === planMap['Professional'] ? 790 : 2490);
      
      await pool.query(`
        INSERT INTO subscriptions 
        (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, next_payment_date, amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        sub.user_id, sub.plan_id, sub.status, sub.billing_cycle,
        currentPeriodStart, currentPeriodEnd, nextPaymentDate, amount
      ]);
    }
    
    // Final verification
    console.log('\n📊 Final counts:');
    const [finalCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due
      FROM subscriptions
    `);
    
    console.log(`Total: ${finalCounts[0].total}`);
    console.log(`Active: ${finalCounts[0].active}`);
    console.log(`Cancelled: ${finalCounts[0].cancelled}`);
    console.log(`Past Due: ${finalCounts[0].past_due}`);
    
    // Plan distribution
    console.log('\n📈 Plan distribution:');
    const [planDist] = await pool.query(`
      SELECT p.name, 
             COUNT(s.id) as total,
             SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name
      ORDER BY active DESC
    `);
    
    planDist.forEach(row => {
      console.log(`- ${row.name}: ${row.active} active / ${row.total} total`);
    });
    
    console.log('\n🎉 Subscriptions added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMoreSubscriptions();