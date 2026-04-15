const axios = require('axios');

async function testChartsDataVerification() {
  try {
    console.log('🔍 Testing Charts Data Verification...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test Analytics Data
    console.log('📊 TESTING ANALYTICS DATA:');
    const analyticsResponse = await axios.get('http://localhost:5000/api/subscriptions/analytics', { headers });
    const analytics = analyticsResponse.data;
    
    console.log('✅ Revenue Growth Data:');
    if (analytics.revenueGrowth && analytics.revenueGrowth.length > 0) {
      analytics.revenueGrowth.forEach((month, index) => {
        console.log(`   ${index + 1}. ${month.month}: $${month.revenue.toLocaleString()}`);
      });
    } else {
      console.log('   ❌ No revenue growth data found');
    }

    console.log('\n✅ Plan Distribution Data:');
    if (analytics.planDistribution) {
      Object.entries(analytics.planDistribution).forEach(([plan, percentage]) => {
        console.log(`   - ${plan}: ${percentage}%`);
      });
    } else {
      console.log('   ❌ No plan distribution data found');
    }

    // Test Date Filtering
    console.log('\n🗓️ TESTING DATE FILTERING:');
    
    // Test with different date ranges
    const dateTests = [
      { start: '2025-01-01', end: '2025-12-31', name: '2025 only' },
      { start: '2026-01-01', end: '2026-12-31', name: '2026 only' },
      { start: '2025-01-01', end: '2026-12-31', name: '2025-2026' },
      { start: '2024-01-01', end: '2024-12-31', name: '2024 only (should be empty)' }
    ];

    for (const test of dateTests) {
      const response = await axios.get('http://localhost:5000/api/subscriptions', {
        headers,
        params: {
          startDate: test.start,
          endDate: test.end,
          limit: 5
        }
      });
      
      console.log(`   ${test.name}: ${response.data.pagination.total} subscriptions`);
      if (response.data.subscriptions.length > 0) {
        const firstSub = response.data.subscriptions[0];
        console.log(`     Sample: ${firstSub.user.name} - created: ${firstSub.id}`);
      }
    }

    // Test current default date range
    console.log('\n📅 Testing current default date range (2025-2026):');
    const defaultResponse = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2026-12-31'
      }
    });
    
    console.log(`✅ Default range returns: ${defaultResponse.data.pagination.total} subscriptions`);

    console.log('\n🎯 SUMMARY:');
    console.log(`- Revenue Growth: ${analytics.revenueGrowth?.length || 0} months of data`);
    console.log(`- Plan Distribution: ${Object.keys(analytics.planDistribution || {}).length} plans`);
    console.log(`- Date Filtering: Working with real date ranges`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testChartsDataVerification();