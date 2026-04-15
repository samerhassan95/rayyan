const pool = require('./config/database');

async function verifyRealData() {
  try {
    console.log('🔍 Verifying Real Data in System...\n');
    
    // 1. Check actual subscription counts
    console.log('📊 SUBSCRIPTION STATISTICS:');
    const [subStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_subscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_subscriptions,
        SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) as past_due_subscriptions
      FROM subscriptions
    `);
    
    console.log(`- Total Subscriptions: ${subStats[0].total_subscriptions}`);
    console.log(`- Active Subscriptions: ${subStats[0].active_subscriptions}`);
    console.log(`- Cancelled Subscriptions: ${subStats[0].cancelled_subscriptions}`);
    console.log(`- Past Due Subscriptions: ${subStats[0].past_due_subscriptions}`);
    
    // Calculate real churn rate
    const churnRate = subStats[0].total_subscriptions > 0 ? 
      ((subStats[0].cancelled_subscriptions / subStats[0].total_subscriptions) * 100).toFixed(1) : 0;
    console.log(`- Churn Rate: ${churnRate}%`);
    
    // 2. Check plan distribution
    console.log('\n📈 PLAN DISTRIBUTION:');
    const [planDist] = await pool.query(`
      SELECT 
        p.name,
        COUNT(s.id) as total_subs,
        SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subs,
        ROUND(
          (SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) * 100.0 / 
           (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')), 0
        ) as percentage
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name
      HAVING COUNT(s.id) > 0
      ORDER BY active_subs DESC
    `);
    
    planDist.forEach(plan => {
      console.log(`- ${plan.name}: ${plan.active_subs} active (${plan.percentage}%) / ${plan.total_subs} total`);
    });
    
    // 3. Check billing cycle distribution
    console.log('\n💳 BILLING CYCLE DISTRIBUTION:');
    const [billingDist] = await pool.query(`
      SELECT 
        billing_cycle,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM subscriptions
      GROUP BY billing_cycle
      ORDER BY count DESC
    `);
    
    billingDist.forEach(cycle => {
      console.log(`- ${cycle.billing_cycle}: ${cycle.active_count} active / ${cycle.count} total`);
    });
    
    // 4. Check revenue data
    console.log('\n💰 REVENUE DATA:');
    const [revenueData] = await pool.query(`
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') as month,
        DATE_FORMAT(MIN(transaction_date), '%b %Y') as month_name,
        COUNT(*) as transaction_count,
        SUM(amount) as total_revenue
      FROM transactions 
      WHERE status = 'successful'
      GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);
    
    console.log('Last 6 months revenue:');
    revenueData.forEach(month => {
      console.log(`- ${month.month_name}: $${parseFloat(month.total_revenue).toLocaleString()} (${month.transaction_count} transactions)`);
    });
    
    // 5. Check date ranges of subscriptions
    console.log('\n📅 SUBSCRIPTION DATE RANGES:');
    const [dateRanges] = await pool.query(`
      SELECT 
        MIN(created_at) as earliest_subscription,
        MAX(created_at) as latest_subscription,
        COUNT(*) as total_count
      FROM subscriptions
    `);
    
    console.log(`- Earliest subscription: ${dateRanges[0].earliest_subscription}`);
    console.log(`- Latest subscription: ${dateRanges[0].latest_subscription}`);
    console.log(`- Total subscriptions: ${dateRanges[0].total_count}`);
    
    // 6. Check users count
    console.log('\n👥 USER STATISTICS:');
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(DISTINCT s.user_id) as users_with_subscriptions
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
    `);
    
    console.log(`- Total Users: ${userStats[0].total_users}`);
    console.log(`- Users with Subscriptions: ${userStats[0].users_with_subscriptions}`);
    
    console.log('\n✅ All data above is REAL from the database!');
    console.log('🎯 The frontend should display these exact numbers.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyRealData();