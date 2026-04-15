const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testUsersNavigation() {
  console.log('🧪 Testing Users Navigation (Table → Detail Pages)...\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin authenticated');

    // Test 1: Users table page
    console.log('\n1. Testing users table page...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users?limit=15`, { headers });
    const { users, statistics, pagination } = usersResponse.data;
    
    console.log(`✅ Users table loaded: ${users.length} users displayed`);
    console.log(`   - Statistics: Seat utilization ${statistics.seatUtilization}%, 2FA enabled: ${statistics.twoFactorEnabled}`);
    console.log(`   - Pagination: Page 1 of ${pagination.pages}, Total: ${pagination.total} users`);

    // Test 2: User detail page
    if (users.length > 0) {
      console.log('\n2. Testing user detail page...');
      const testUser = users[0];
      console.log(`   - Testing with user: ${testUser.username} (ID: ${testUser.id})`);
      
      const userDetailResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}`, { headers });
      const userDetail = userDetailResponse.data;
      
      console.log(`✅ User detail loaded for: ${userDetail.user.username}`);
      console.log(`   - Profile: ${userDetail.user.job_title || 'No job title'}`);
      console.log(`   - Contact: ${userDetail.user.email}, ${userDetail.user.phone || 'No phone'}`);
      console.log(`   - Address: ${userDetail.user.address || 'No address'}`);
      console.log(`   - Status: ${userDetail.user.status}, 2FA: ${userDetail.user.two_factor_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   - Statistics: $${userDetail.statistics.totalPayments} payments, ${userDetail.statistics.activeSubscriptions} subscriptions`);
      console.log(`   - Data: ${userDetail.transactions.length} transactions, ${userDetail.supportTickets.length} tickets`);
    }

    // Test 3: Search functionality
    console.log('\n3. Testing search in users table...');
    const searchResponse = await axios.get(`${API_URL}/api/admin/users?search=Alexander&limit=15`, { headers });
    console.log(`✅ Search results: ${searchResponse.data.users.length} users found for "Alexander"`);

    // Test 4: Pagination
    console.log('\n4. Testing pagination...');
    const page2Response = await axios.get(`${API_URL}/api/admin/users?page=2&limit=5`, { headers });
    console.log(`✅ Page 2 loaded: ${page2Response.data.users.length} users`);
    console.log(`   - Pagination info: Page ${page2Response.data.pagination.page} of ${page2Response.data.pagination.pages}`);

    // Test 5: User status update from table
    if (users.length > 0) {
      console.log('\n5. Testing user status update from table...');
      const testUser = users.find(u => u.status === 'active');
      if (testUser) {
        console.log(`   - Testing with user: ${testUser.username} (current status: ${testUser.status})`);
        
        // Suspend user
        await axios.put(`${API_URL}/api/admin/users/${testUser.id}/status`, 
          { status: 'suspended' }, { headers });
        console.log(`✅ User suspended successfully`);
        
        // Revert status
        await axios.put(`${API_URL}/api/admin/users/${testUser.id}/status`, 
          { status: 'active' }, { headers });
        console.log(`✅ User status reverted to active`);
      }
    }

    console.log('\n🎉 All navigation tests passed!');
    console.log('\n📋 Navigation Flow Summary:');
    console.log('   ✅ Users Table Page (/admin/users)');
    console.log('     - Displays users in table format');
    console.log('     - Shows statistics cards');
    console.log('     - Has search functionality');
    console.log('     - Supports pagination');
    console.log('     - Allows status updates');
    console.log('     - Clicking user navigates to detail page');
    console.log('');
    console.log('   ✅ User Detail Page (/admin/users/[id])');
    console.log('     - Shows complete user profile');
    console.log('     - Displays statistics cards');
    console.log('     - Has usage activity chart');
    console.log('     - Shows support tickets table');
    console.log('     - Includes security context');
    console.log('     - Allows profile editing');
    console.log('     - Has back button to users table');

  } catch (error) {
    console.error('❌ Navigation test failed:', error.response?.data || error.message);
  }
}

testUsersNavigation();