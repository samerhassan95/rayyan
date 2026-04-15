// Test script to verify admin functionality
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAdminFunctionality() {
  try {
    console.log('🧪 Testing Admin Dashboard Functionality...\n');

    // 1. Test login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful\n');

    // 2. Test dashboard stats
    console.log('2. Testing dashboard stats...');
    const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    console.log('✅ Dashboard stats loaded:', Object.keys(statsResponse.data));
    console.log('   - Total Users:', statsResponse.data.stats.totalUsers);
    console.log('   - Total Revenue:', statsResponse.data.stats.totalRevenue);
    console.log('   - Active Subscriptions:', statsResponse.data.stats.activeSubscriptions);
    console.log('   - Growth Rate:', statsResponse.data.stats.growthRate + '%\n');

    // 3. Test notifications
    console.log('3. Testing notifications...');
    const notificationsResponse = await axios.get(`${API_URL}/api/admin/notifications`, { headers });
    console.log('✅ Notifications loaded:', notificationsResponse.data.length, 'notifications');
    if (notificationsResponse.data.length > 0) {
      console.log('   - Latest:', notificationsResponse.data[0].message);
    }
    console.log('');

    // 4. Test activity log
    console.log('4. Testing activity log...');
    const activityResponse = await axios.get(`${API_URL}/api/admin/activity-log`, { headers });
    console.log('✅ Activity log loaded:', activityResponse.data.length, 'activities');
    if (activityResponse.data.length > 0) {
      console.log('   - Latest:', activityResponse.data[0].description);
    }
    console.log('');

    // 5. Test search functionality
    console.log('5. Testing search functionality...');
    const searchResponse = await axios.get(`${API_URL}/api/admin/search?q=admin`, { headers });
    console.log('✅ Search results:', searchResponse.data.results.length, 'results');
    console.log('');

    // 6. Test user management
    console.log('6. Testing user management...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users?limit=5`, { headers });
    console.log('✅ Users loaded:', usersResponse.data.users.length, 'users');
    console.log('   - Seat Utilization:', usersResponse.data.statistics.seatUtilization + '%');
    console.log('');

    // 7. Test filtered transactions
    console.log('7. Testing transaction filtering...');
    const transactionsResponse = await axios.get(`${API_URL}/api/admin/transactions/filtered?status=all&limit=5`, { headers });
    console.log('✅ Transactions loaded:', transactionsResponse.data.length, 'transactions');
    console.log('');

    // 8. Test user acquisition analytics
    console.log('8. Testing user acquisition analytics...');
    const acquisitionResponse = await axios.get(`${API_URL}/api/admin/analytics/user-acquisition`, { headers });
    console.log('✅ User acquisition data loaded');
    console.log('   - Total by source:', acquisitionResponse.data.totalBySource.length, 'sources');
    console.log('');

    console.log('🎉 All admin functionality tests passed!\n');
    console.log('✅ Profile page: Navigate to /admin/profile');
    console.log('✅ Search: Type in the search box in header');
    console.log('✅ Dark mode: Click the moon/sun icon in header');
    console.log('✅ Notifications: Click the bell icon in header');
    console.log('✅ User menu: Click on user avatar in header');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

testAdminFunctionality();