const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUsersPageComplete() {
  console.log('🧪 Testing Users Page Complete Functionality...\n');

  try {
    // Test admin login
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful');

    // Test users list endpoint
    console.log('\n2. Testing users list endpoint...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users`, { headers });
    const { users, pagination, statistics } = usersResponse.data;
    
    console.log(`✅ Users list retrieved: ${users.length} users`);
    console.log(`   - Total pages: ${pagination.pages}`);
    console.log(`   - Statistics: ${JSON.stringify(statistics, null, 2)}`);
    
    // Verify user data structure
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`   - First user: ${firstUser.username}`);
      console.log(`   - Job title: ${firstUser.job_title || 'Not set'}`);
      console.log(`   - Address: ${firstUser.address || 'Not set'}`);
      console.log(`   - 2FA: ${firstUser.two_factor_enabled ? 'Enabled' : 'Disabled'}`);
    }

    // Test search functionality
    console.log('\n3. Testing search functionality...');
    const searchResponse = await axios.get(`${API_URL}/api/admin/users?search=Alexander`, { headers });
    console.log(`✅ Search results: ${searchResponse.data.users.length} users found`);

    // Test user details endpoint
    if (users.length > 0) {
      console.log('\n4. Testing user details endpoint...');
      const userId = users[0].id;
      const userDetailResponse = await axios.get(`${API_URL}/api/admin/users/${userId}`, { headers });
      const userDetail = userDetailResponse.data;
      
      console.log(`✅ User details retrieved for: ${userDetail.user.username}`);
      console.log(`   - Transactions: ${userDetail.transactions.length}`);
      console.log(`   - Subscriptions: ${userDetail.subscriptions.length}`);
      console.log(`   - Support tickets: ${userDetail.supportTickets.length}`);
      console.log(`   - Usage activity data points: ${userDetail.usageActivity.length}`);
      console.log(`   - Statistics: ${JSON.stringify(userDetail.statistics, null, 2)}`);
    }

    // Test user status update
    if (users.length > 0) {
      console.log('\n5. Testing user status update...');
      const userId = users[0].id;
      const currentStatus = users[0].status;
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      await axios.put(`${API_URL}/api/admin/users/${userId}/status`, 
        { status: newStatus }, 
        { headers }
      );
      console.log(`✅ User status updated from ${currentStatus} to ${newStatus}`);
      
      // Revert back
      await axios.put(`${API_URL}/api/admin/users/${userId}/status`, 
        { status: currentStatus }, 
        { headers }
      );
      console.log(`✅ User status reverted back to ${currentStatus}`);
    }

    // Test pagination
    console.log('\n6. Testing pagination...');
    const page2Response = await axios.get(`${API_URL}/api/admin/users?page=2&limit=5`, { headers });
    console.log(`✅ Page 2 retrieved: ${page2Response.data.users.length} users`);

    console.log('\n🎉 All Users Page tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Total users in system: ${pagination.total}`);
    console.log(`   - Users with job titles: ${users.filter(u => u.job_title).length}`);
    console.log(`   - Users with addresses: ${users.filter(u => u.address).length}`);
    console.log(`   - Users with 2FA enabled: ${users.filter(u => u.two_factor_enabled).length}`);
    console.log(`   - Seat utilization: ${statistics.seatUtilization}%`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Make sure the backend server is running and admin user exists');
    }
  }
}

testUsersPageComplete();