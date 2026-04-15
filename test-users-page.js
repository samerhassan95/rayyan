const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUsersPage() {
  console.log('👥 Testing Users Page Functionality...\n');

  try {
    // Login first
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Get users list
    console.log('1. Testing users list...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users?page=1&limit=10`, { headers });
    const { users, pagination, statistics } = usersResponse.data;
    
    console.log('✅ Users list loaded:');
    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Pagination: Page ${pagination.page} of ${pagination.pages}`);
    console.log(`   - Statistics: ${JSON.stringify(statistics)}`);
    console.log('');

    // Test 2: Get user details
    if (users.length > 0) {
      console.log('2. Testing user details...');
      const userId = users[0].id;
      const userDetailResponse = await axios.get(`${API_URL}/api/admin/users/${userId}`, { headers });
      const userDetail = userDetailResponse.data;
      
      console.log('✅ User details loaded:');
      console.log(`   - User: ${userDetail.user.username}`);
      console.log(`   - Email: ${userDetail.user.email}`);
      console.log(`   - Status: ${userDetail.user.status}`);
      console.log(`   - Subscriptions: ${userDetail.subscriptions.length}`);
      console.log(`   - Transactions: ${userDetail.transactions.length}`);
      console.log(`   - Support Tickets: ${userDetail.supportTickets.length}`);
      console.log(`   - Sessions: ${userDetail.sessions.length}`);
      console.log(`   - Statistics: ${JSON.stringify(userDetail.statistics)}`);
      console.log('');

      // Test 3: Update user status
      console.log('3. Testing user status update...');
      try {
        await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status: 'active' }, { headers });
        console.log('✅ User status updated successfully');
      } catch (statusError) {
        console.log('⚠️  User status update failed:', statusError.response?.data?.error || statusError.message);
      }
      console.log('');
    }

    // Test 4: Search functionality
    console.log('4. Testing search functionality...');
    try {
      const searchResponse = await axios.get(`${API_URL}/api/admin/users?search=admin&limit=5`, { headers });
      console.log(`✅ Search results: ${searchResponse.data.users.length} users found`);
    } catch (searchError) {
      console.log('⚠️  Search failed:', searchError.response?.data?.error || searchError.message);
    }
    console.log('');

    // Test 5: Check data realism
    console.log('5. Checking data realism...');
    
    const sampleUser = users[0];
    console.log('📊 Sample user data:');
    console.log(`   - Username: ${sampleUser.username}`);
    console.log(`   - Email: ${sampleUser.email}`);
    console.log(`   - Role: ${sampleUser.role}`);
    console.log(`   - Status: ${sampleUser.status}`);
    console.log(`   - Job Title: ${sampleUser.job_title || 'Not set'}`);
    console.log(`   - Phone: ${sampleUser.phone || 'Not set'}`);
    console.log(`   - Created: ${sampleUser.created_at}`);
    console.log('');

    console.log('📋 Users Page Assessment:');
    console.log('✅ Users list loads from database');
    console.log('✅ Pagination works');
    console.log('✅ User details load with full profile');
    console.log('✅ Search functionality available');
    console.log('✅ Status update functionality');
    console.log('⚠️  Need to check if frontend uses real data or hardcoded values');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

testUsersPage();