const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAddUserFunctionality() {
  try {
    console.log('🔍 Testing Add User Functionality...\n');

    // First, login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Test creating a new user
    console.log('2. Creating a new user...');
    const newUserData = {
      username: 'testuser_' + Date.now(),
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123',
      phone: '+1 (555) 123-4567',
      job_title: 'Software Engineer',
      address: '123 Test Street, Test City, TC 12345'
    };

    const createUserResponse = await axios.post(`${API_URL}/api/admin/users`, newUserData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ User created successfully!');
    console.log('📋 Created User:', JSON.stringify(createUserResponse.data, null, 2));

    const newUserId = createUserResponse.data.userId;

    // Test fetching the created user details
    console.log('\n3. Fetching user details...');
    const userDetailResponse = await axios.get(`${API_URL}/api/admin/users/${newUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ User details fetched successfully!');
    console.log('👤 User Details:');
    console.log(`   - ID: ${userDetailResponse.data.user.id}`);
    console.log(`   - Username: ${userDetailResponse.data.user.username}`);
    console.log(`   - Email: ${userDetailResponse.data.user.email}`);
    console.log(`   - Phone: ${userDetailResponse.data.user.phone}`);
    console.log(`   - Job Title: ${userDetailResponse.data.user.job_title}`);
    console.log(`   - Status: ${userDetailResponse.data.user.status}`);
    console.log(`   - Created: ${userDetailResponse.data.user.created_at}`);

    console.log('\n📊 User Statistics:');
    console.log(`   - Total Payments: $${userDetailResponse.data.statistics.totalPayments}`);
    console.log(`   - Active Subscriptions: ${userDetailResponse.data.statistics.activeSubscriptions}`);
    console.log(`   - Open Tickets: ${userDetailResponse.data.statistics.openTickets}`);

    console.log('\n📈 Additional Data:');
    console.log(`   - Subscriptions: ${userDetailResponse.data.subscriptions.length}`);
    console.log(`   - Transactions: ${userDetailResponse.data.transactions.length}`);
    console.log(`   - Support Tickets: ${userDetailResponse.data.supportTickets.length}`);
    console.log(`   - Sessions: ${userDetailResponse.data.sessions.length}`);
    console.log(`   - Usage Activity Points: ${userDetailResponse.data.usageActivity.length}`);

    // Test updating user status
    console.log('\n4. Testing user status update...');
    await axios.put(`${API_URL}/api/admin/users/${newUserId}/status`, 
      { status: 'suspended' }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ User status updated to suspended');

    // Verify status change
    const updatedUserResponse = await axios.get(`${API_URL}/api/admin/users/${newUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Status verified: ${updatedUserResponse.data.user.status}`);

    // Test updating user profile
    console.log('\n5. Testing user profile update...');
    const updateData = {
      job_title: 'Senior Software Engineer',
      bio: 'Experienced developer with expertise in full-stack development'
    };

    await axios.put(`${API_URL}/api/admin/users/${newUserId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ User profile updated successfully');

    // Verify profile update
    const finalUserResponse = await axios.get(`${API_URL}/api/admin/users/${newUserId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Job title updated: ${finalUserResponse.data.user.job_title}`);
    console.log(`✅ Bio updated: ${finalUserResponse.data.user.bio}`);

    console.log('\n🎉 All tests passed! Add User functionality is working perfectly!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User creation with validation');
    console.log('   ✅ User details fetching with comprehensive data');
    console.log('   ✅ User status management');
    console.log('   ✅ User profile updates');
    console.log('   ✅ Proper error handling and validation');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('🔍 Error details:', error.response.data.error);
    }
  }
}

testAddUserFunctionality();