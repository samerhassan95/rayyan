// Test script to verify admin functionality
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAdminFunctionality() {
  try {
    console.log('🧪 Testing Rayyan Admin Functionality...\n');

    // Test 1: API Health Check
    console.log('1. Testing API health...');
    const healthResponse = await axios.get(`${API_URL}/api/test`);
    console.log('✅ API Health:', healthResponse.data.message);
    console.log('✅ Database:', healthResponse.data.database);

    // Test 2: Admin Login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    console.log('✅ Admin login successful');
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 3: Dashboard Stats
    console.log('\n3. Testing dashboard stats...');
    const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    console.log('✅ Dashboard stats loaded:', {
      totalUsers: statsResponse.data.stats.totalUsers,
      totalRevenue: statsResponse.data.stats.totalRevenue,
      activeSubscriptions: statsResponse.data.stats.activeSubscriptions
    });

    // Test 4: Users Management
    console.log('\n4. Testing users management...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users`, { headers });
    console.log('✅ Users loaded:', usersResponse.data.users?.length || 0, 'users');

    // Test 5: Plans Management
    console.log('\n5. Testing plans management...');
    const plansResponse = await axios.get(`${API_URL}/api/plans`, { headers });
    console.log('✅ Plans loaded:', plansResponse.data?.length || 0, 'plans');

    // Test 6: Plans Analytics
    console.log('\n6. Testing plans analytics...');
    const analyticsResponse = await axios.get(`${API_URL}/api/plans/analytics`, { headers });
    console.log('✅ Analytics loaded:', {
      totalMonthlyRevenue: analyticsResponse.data.totalMonthlyRevenue,
      activeSubscriptions: analyticsResponse.data.activeSubscriptions
    });

    // Test 7: Settings
    console.log('\n7. Testing settings...');
    const settingsResponse = await axios.get(`${API_URL}/api/admin/settings`, { headers });
    console.log('✅ Settings loaded:', settingsResponse.data?.length || 0, 'settings');

    console.log('\n🎉 All tests passed! Admin functionality is working correctly.');
    console.log('\n📋 Summary:');
    console.log('- ✅ API and Database connection');
    console.log('- ✅ Admin authentication');
    console.log('- ✅ Dashboard statistics');
    console.log('- ✅ User management');
    console.log('- ✅ Plans management');
    console.log('- ✅ Analytics');
    console.log('- ✅ Settings management');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the backend server is running: cd backend && npm start');
    console.log('2. Verify database is running on port 3307');
    console.log('3. Check that admin user exists with credentials: admin@rayyan.com / password');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAdminFunctionality();
}

module.exports = { testAdminFunctionality };