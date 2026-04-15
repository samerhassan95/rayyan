const pool = require('./backend/config/database');

async function debugDateFiltering() {
  try {
    console.log('🔍 Debugging Date Filtering Issues...\n');

    // Check actual subscription dates
    console.log('📅 ACTUAL SUBSCRIPTION DATES:');
    const [subscriptions] = await pool.execute(`
      SELECT id, user_id, created_at, 
             DATE(created_at) as creation_date,
             YEAR(created_at) as creation_year
      FROM subscriptions 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    subscriptions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ID: ${sub.id}, Date: ${sub.creation_date}, Year: ${sub.creation_year}`);
    });

    // Check date range distribution
    console.log('\n📊 DATE RANGE DISTRIBUTION:');
    const [yearDistribution] = await pool.execute(`
      SELECT YEAR(created_at) as year, COUNT(*) as count
      FROM subscriptions 
      GROUP BY YEAR(created_at)
      ORDER BY year
    `);

    yearDistribution.forEach(year => {
      console.log(`   ${year.year}: ${year.count} subscriptions`);
    });

    // Test specific date filtering queries
    console.log('\n🧪 TESTING DATE FILTER QUERIES:');
    
    // Test 2025 only
    const [subs2025] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE DATE(created_at) BETWEEN '2025-01-01' AND '2025-12-31'
    `);
    console.log(`   2025 only (BETWEEN): ${subs2025[0].count}`);

    // Test 2026 only  
    const [subs2026] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions 
      WHERE DATE(created_at) BETWEEN '2026-01-01' AND '2026-12-31'
    `);
    console.log(`   2026 only (BETWEEN): ${subs2026[0].count}`);

    // Test the exact query from backend
    const [backendQuery] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      JOIN plans p ON s.plan_id = p.id
      WHERE DATE(s.created_at) BETWEEN '2025-01-01' AND '2025-12-31'
    `);
    console.log(`   Backend query 2025: ${backendQuery[0].total}`);

    // Check if there are any NULL dates
    const [nullDates] = await pool.execute(`
      SELECT COUNT(*) as count FROM subscriptions WHERE created_at IS NULL
    `);
    console.log(`   NULL dates: ${nullDates[0].count}`);

    // Test with sample subscription IDs to see their actual dates
    console.log('\n🔍 SAMPLE SUBSCRIPTION DETAILS:');
    const [sampleSubs] = await pool.execute(`
      SELECT s.id, s.created_at, u.username, p.name as plan_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id  
      JOIN plans p ON s.plan_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    sampleSubs.forEach((sub, index) => {
      console.log(`   ${index + 1}. ID: ${sub.id}, User: ${sub.username}, Plan: ${sub.plan_name}, Date: ${sub.created_at}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugDateFiltering();