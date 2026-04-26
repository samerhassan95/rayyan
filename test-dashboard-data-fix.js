const axios = require('axios');

const API_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@rayyan.com';
const ADMIN_PASSWORD = 'password';

async function testDashboardData() {
  console.log('🧪 Testing Dashboard Data Loading...\n');

  try {
    // 1. Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin logged in successfully\n');

    // 2. Fetch dashboard stats
    console.log('2️⃣ Fetching dashboard stats...');
    const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    const data = statsResponse.data;
    
    console.log('✅ Dashboard data received\n');

    // 3. Verify stats data
    console.log('3️⃣ Stats Data:');
    console.log(`   - Total Users: ${data.stats?.totalUsers || 0}`);
    console.log(`   - Total Revenue: $${data.stats?.totalRevenue?.toLocaleString() || 0}`);
    console.log(`   - Active Subscriptions: ${data.stats?.activeSubscriptions || 0}`);
    console.log(`   - Growth Rate: ${data.stats?.growthRate || 0}%`);
    console.log(`   - User Growth: ${data.stats?.userGrowth || 0}%`);
    console.log(`   - Subs Growth: ${data.stats?.subsGrowth || 0}%\n`);

    // 4. Verify recent transactions
    console.log('4️⃣ Recent Transactions:');
    console.log(`   - Count: ${data.recentTransactions?.length || 0}`);
    if (data.recentTransactions && data.recentTransactions.length > 0) {
      console.log(`   - First transaction: ${data.recentTransactions[0].username} - $${data.recentTransactions[0].amount}`);
    }
    console.log('');

    // 5. Verify monthly revenue
    console.log('5️⃣ Monthly Revenue:');
    console.log(`   - Months: ${data.monthlyRevenue?.length || 0}`);
    if (data.monthlyRevenue && data.monthlyRevenue.length > 0) {
      const latest = data.monthlyRevenue[data.monthlyRevenue.length - 1];
      console.log(`   - Latest month: ${latest.month} - $${latest.revenue?.toLocaleString()}`);
    }
    console.log('');

    // 6. Verify user acquisition
    console.log('6️⃣ User Acquisition:');
    console.log(`   - Direct: ${data.userAcquisition?.direct || 0}% (${data.userAcquisition?.directCount || 0} users)`);
    console.log(`   - Referral: ${data.userAcquisition?.referral || 0}% (${data.userAcquisition?.referralCount || 0} users)`);
    console.log(`   - Social: ${data.userAcquisition?.social || 0}% (${data.userAcquisition?.socialCount || 0} users)`);
    console.log(`   - Other: ${data.userAcquisition?.other || 0}% (${data.userAcquisition?.otherCount || 0} users)`);
    console.log(`   - Total: ${data.userAcquisition?.total || 0} users\n`);

    // 7. Check for null/undefined values
    console.log('7️⃣ Checking for null/undefined values...');
    const issues = [];
    
    if (!data.stats) issues.push('stats is null/undefined');
    if (!data.stats?.totalRevenue && data.stats?.totalRevenue !== 0) issues.push('totalRevenue is null/undefined');
    if (!data.stats?.totalUsers && data.stats?.totalUsers !== 0) issues.push('totalUsers is null/undefined');
    if (!data.recentTransactions) issues.push('recentTransactions is null/undefined');
    if (!data.monthlyRevenue) issues.push('monthlyRevenue is null/undefined');
    if (!data.userAcquisition) issues.push('userAcquisition is null/undefined');

    if (issues.length > 0) {
      console.log('   ⚠️ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ All data fields are properly populated');
    }

    console.log('\n✅ Dashboard data test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Stats: ${data.stats ? '✓' : '✗'}`);
    console.log(`   - Transactions: ${data.recentTransactions?.length || 0} items`);
    console.log(`   - Monthly Revenue: ${data.monthlyRevenue?.length || 0} months`);
    console.log(`   - User Acquisition: ${data.userAcquisition ? '✓' : '✗'}`);
    
    if (issues.length === 0) {
      console.log('\n🎉 All dashboard data is loading correctly!');
    } else {
      console.log('\n⚠️ Some data is missing. Run setup scripts to populate database.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have run the setup scripts to create the admin user');
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure the backend server is running on port 5000');
    }
  }
}

testDashboardData();
