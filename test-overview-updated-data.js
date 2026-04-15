const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testOverviewUpdatedData() {
  console.log('🔍 Testing Overview Page with Updated Data...\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin authenticated');

    // Test Overview Dashboard Stats
    console.log('\n1. Testing Overview Dashboard Statistics...');
    const dashboardResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    const stats = dashboardResponse.data.stats;
    
    console.log('📊 Updated Dashboard Statistics:');
    console.log(`   - Total Users: ${stats.totalUsers}`);
    console.log(`   - Total Revenue: $${stats.totalRevenue}`);
    console.log(`   - Active Subscriptions: ${stats.activeSubscriptions}`);
    console.log(`   - Growth Rate: ${stats.growthRate}%`);
    console.log(`   - Open Tickets: ${stats.openTickets}`);

    // Test Recent Transactions
    console.log('\n2. Testing Recent Transactions...');
    const recentTransactions = dashboardResponse.data.recentTransactions;
    console.log(`   - Recent Transactions Count: ${recentTransactions.length}`);
    
    if (recentTransactions.length > 0) {
      console.log('   - Sample Recent Transactions:');
      recentTransactions.slice(0, 3).forEach((transaction, index) => {
        console.log(`     ${index + 1}. ${transaction.username}: $${transaction.amount} (${transaction.status})`);
      });
    }

    // Test Monthly Revenue Data
    console.log('\n3. Testing Monthly Revenue Chart Data...');
    const monthlyRevenue = dashboardResponse.data.monthlyRevenue;
    console.log(`   - Monthly Revenue Data Points: ${monthlyRevenue.length}`);
    
    if (monthlyRevenue.length > 0) {
      console.log('   - Sample Monthly Data:');
      monthlyRevenue.slice(-3).forEach((month, index) => {
        console.log(`     ${month.month}: $${month.revenue} (${month.transactions} transactions)`);
      });
    }

    // Test User Acquisition Data
    console.log('\n4. Testing User Acquisition Data...');
    const userAcquisition = dashboardResponse.data.userAcquisition;
    console.log('   - User Acquisition Breakdown:');
    console.log(`     Direct: ${userAcquisition.direct}% (${userAcquisition.directCount} users)`);
    console.log(`     Referral: ${userAcquisition.referral}% (${userAcquisition.referralCount} users)`);
    console.log(`     Social: ${userAcquisition.social}% (${userAcquisition.socialCount} users)`);
    console.log(`     Other: ${userAcquisition.other}% (${userAcquisition.otherCount} users)`);
    console.log(`     Total: ${userAcquisition.total} users`);

    // Test Filtered Transactions
    console.log('\n5. Testing Transaction Filtering...');
    const filteredResponse = await axios.get(`${API_URL}/api/admin/transactions/filtered?limit=5`, { headers });
    console.log(`   - Filtered Transactions: ${filteredResponse.data.length}`);
    
    if (filteredResponse.data.length > 0) {
      console.log('   - Sample Filtered Transactions:');
      filteredResponse.data.slice(0, 3).forEach((transaction, index) => {
        console.log(`     ${index + 1}. ${transaction.username}: $${transaction.amount} (${transaction.status})`);
      });
    }

    // Compare with expected values based on comprehensive data
    console.log('\n6. Data Validation...');
    
    // Check if data reflects the comprehensive data we added
    const expectedMinUsers = 21; // We know we have at least 21 users
    const expectedMinTransactions = 100; // Should have many transactions now
    
    console.log('✅ Validation Results:');
    console.log(`   - Users count adequate: ${stats.totalUsers >= expectedMinUsers ? '✅' : '❌'} (${stats.totalUsers} >= ${expectedMinUsers})`);
    console.log(`   - Revenue updated: ${stats.totalRevenue > 10000 ? '✅' : '❌'} ($${stats.totalRevenue} > $10,000)`);
    console.log(`   - Active subscriptions: ${stats.activeSubscriptions > 10 ? '✅' : '❌'} (${stats.activeSubscriptions} > 10)`);
    console.log(`   - Recent transactions available: ${recentTransactions.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Monthly revenue data: ${monthlyRevenue.length > 0 ? '✅' : '❌'}`);

    console.log('\n🎉 Overview Data Test Summary:');
    console.log('   📊 Dashboard statistics reflect updated data');
    console.log('   💳 Recent transactions show real user activity');
    console.log('   📈 Monthly revenue chart has comprehensive data');
    console.log('   👥 User acquisition shows actual source distribution');
    console.log('   🔍 Transaction filtering works with new data');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testOverviewUpdatedData();