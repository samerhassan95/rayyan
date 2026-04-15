const axios = require('axios');

async function testDateFilteringDetailed() {
  try {
    console.log('🔍 Testing Date Filtering in Detail...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Get all subscriptions without date filter
    console.log('📋 TEST 1: All subscriptions (no date filter)');
    const allResponse = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: { limit: 100 }
    });
    console.log(`   Total: ${allResponse.data.pagination.total} subscriptions`);
    
    // Show first few subscription creation dates
    if (allResponse.data.subscriptions.length > 0) {
      console.log('   Sample subscription IDs and dates:');
      allResponse.data.subscriptions.slice(0, 5).forEach((sub, index) => {
        console.log(`     ${index + 1}. ID: ${sub.id}, User: ${sub.user.name}`);
      });
    }

    // Test 2: Filter by 2025 only
    console.log('\n📋 TEST 2: 2025 only (2025-01-01 to 2025-12-31)');
    const response2025 = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        limit: 100
      }
    });
    console.log(`   Found: ${response2025.data.pagination.total} subscriptions`);
    if (response2025.data.subscriptions.length > 0) {
      console.log('   Sample:');
      response2025.data.subscriptions.slice(0, 3).forEach((sub, index) => {
        console.log(`     ${index + 1}. ID: ${sub.id}, User: ${sub.user.name}`);
      });
    }

    // Test 3: Filter by 2026 only
    console.log('\n📋 TEST 3: 2026 only (2026-01-01 to 2026-12-31)');
    const response2026 = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        limit: 100
      }
    });
    console.log(`   Found: ${response2026.data.pagination.total} subscriptions`);
    if (response2026.data.subscriptions.length > 0) {
      console.log('   Sample:');
      response2026.data.subscriptions.slice(0, 3).forEach((sub, index) => {
        console.log(`     ${index + 1}. ID: ${sub.id}, User: ${sub.user.name}`);
      });
    }

    // Test 4: Filter by a narrow date range in 2025
    console.log('\n📋 TEST 4: January 2025 only (2025-01-01 to 2025-01-31)');
    const responseJan2025 = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        limit: 100
      }
    });
    console.log(`   Found: ${responseJan2025.data.pagination.total} subscriptions`);

    // Test 5: Filter by a narrow date range in 2026
    console.log('\n📋 TEST 5: January 2026 only (2026-01-01 to 2026-01-31)');
    const responseJan2026 = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        limit: 100
      }
    });
    console.log(`   Found: ${responseJan2026.data.pagination.total} subscriptions`);

    // Test 6: Very wide range
    console.log('\n📋 TEST 6: Very wide range (2020-01-01 to 2030-12-31)');
    const responseWide = await axios.get('http://localhost:5000/api/subscriptions', {
      headers,
      params: {
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        limit: 100
      }
    });
    console.log(`   Found: ${responseWide.data.pagination.total} subscriptions`);

    console.log('\n🎯 ANALYSIS:');
    console.log(`- All subscriptions: ${allResponse.data.pagination.total}`);
    console.log(`- 2025 only: ${response2025.data.pagination.total}`);
    console.log(`- 2026 only: ${response2026.data.pagination.total}`);
    console.log(`- Jan 2025: ${responseJan2025.data.pagination.total}`);
    console.log(`- Jan 2026: ${responseJan2026.data.pagination.total}`);
    console.log(`- Wide range: ${responseWide.data.pagination.total}`);

    const total2025and2026 = response2025.data.pagination.total + response2026.data.pagination.total;
    console.log(`- 2025 + 2026 = ${total2025and2026}`);
    
    if (total2025and2026 !== allResponse.data.pagination.total) {
      console.log('❌ ISSUE: Date filtering is not working correctly!');
      console.log('   The sum of 2025 + 2026 should equal total subscriptions');
    } else {
      console.log('✅ Date filtering appears to be working correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDateFilteringDetailed();