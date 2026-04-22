const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUsersAPI() {
  try {
    console.log('🔍 Testing Users API Integration...\n');

    // First, login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Test the admin users endpoint
    console.log('2. Fetching users from admin API...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Users API Response:');
    console.log('📊 Statistics:', JSON.stringify(usersResponse.data.statistics, null, 2));
    console.log('📄 Pagination:', JSON.stringify(usersResponse.data.pagination, null, 2));
    console.log('👥 Sample Users:');
    
    usersResponse.data.users.slice(0, 3).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.email})`);
      console.log(`      Plan: ${user.plan_name || 'No Plan'}`);
      console.log(`      Status: ${user.status}`);
      console.log(`      Last Login: ${user.last_login || 'Never'}`);
      console.log('');
    });

    // Test data transformation (simulate frontend)
    console.log('3. Testing data transformation...');
    const transformedUsers = usersResponse.data.users.map(user => ({
      id: user.id,
      customer: user.username || 'Unknown',
      contact: user.email || 'No email',
      email: user.phone || 'No phone',
      plan: user.plan_name || 'No Plan',
      status: user.status || 'inactive',
      lastActive: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
    }));

    console.log('✅ Transformed data for frontend:');
    transformedUsers.slice(0, 2).forEach((user, index) => {
      console.log(`   ${index + 1}. Customer: ${user.customer}`);
      console.log(`      Contact: ${user.contact}`);
      console.log(`      Plan: ${user.plan}`);
      console.log(`      Status: ${user.status}`);
      console.log(`      Last Active: ${user.lastActive}`);
      console.log('');
    });

    console.log('🎉 Users API integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total Users: ${usersResponse.data.statistics.totalUsers}`);
    console.log(`   - Active Subscriptions: ${usersResponse.data.statistics.activeSubscriptions}`);
    console.log(`   - New This Month: ${usersResponse.data.statistics.newThisMonth}`);
    console.log(`   - Seat Utilization: ${usersResponse.data.statistics.seatUtilization}%`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUsersAPI();