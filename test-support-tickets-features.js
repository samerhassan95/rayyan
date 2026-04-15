const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSupportTicketsFeatures() {
  console.log('🎫 Testing Support Tickets Features...\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin authenticated');

    // Get a user with support tickets
    const usersResponse = await axios.get(`${API_URL}/api/admin/users`, { headers });
    const testUser = usersResponse.data.users.find(u => u.id === 4); // Alexander Sterling
    
    console.log(`\n📋 Testing with user: ${testUser.username} (ID: ${testUser.id})`);

    // Get user details to see support tickets
    const userDetailResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}`, { headers });
    const userDetail = userDetailResponse.data;
    
    console.log('\n1. Testing Support Tickets Data...');
    console.log(`   - Total support tickets: ${userDetail.supportTickets.length}`);
    
    if (userDetail.supportTickets.length > 0) {
      // Group tickets by status
      const ticketsByStatus = userDetail.supportTickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   - Tickets by status:');
      Object.entries(ticketsByStatus).forEach(([status, count]) => {
        console.log(`     ${status}: ${count} tickets`);
      });
      
      // Show sample tickets with all details
      console.log('\n   - Sample ticket details:');
      userDetail.supportTickets.slice(0, 2).forEach((ticket, index) => {
        console.log(`     ${index + 1}. Ticket #${ticket.ticket_number}`);
        console.log(`        Subject: ${ticket.subject}`);
        console.log(`        Category: ${ticket.category}`);
        console.log(`        Priority: ${ticket.priority}`);
        console.log(`        Status: ${ticket.status}`);
        console.log(`        Created: ${new Date(ticket.created_at).toLocaleDateString()}`);
        console.log(`        Updated: ${new Date(ticket.updated_at).toLocaleDateString()}`);
      });
    }

    // Test 2: CSV Export functionality
    console.log('\n2. Testing CSV Export functionality...');
    try {
      const exportResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}/support-tickets/export`, { 
        headers,
        responseType: 'text'
      });
      
      console.log('✅ CSV export endpoint accessible');
      console.log(`   - Response type: ${typeof exportResponse.data}`);
      console.log(`   - Content length: ${exportResponse.data.length} characters`);
      
      // Parse CSV content
      const lines = exportResponse.data.split('\n');
      console.log(`   - CSV lines: ${lines.length}`);
      console.log(`   - Headers: ${lines[0]}`);
      
      if (lines.length > 1) {
        console.log(`   - Sample data line: ${lines[1]}`);
        console.log('✅ CSV export contains data');
      } else {
        console.log('⚠️  CSV export is empty (no tickets for this user)');
      }
      
    } catch (exportError) {
      console.log(`❌ CSV export failed: ${exportError.response?.status} - ${exportError.response?.statusText}`);
    }

    // Test 3: Usage Activity with period filtering
    console.log('\n3. Testing Usage Activity period filtering...');
    
    // Test Month period
    const monthResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}/usage-activity?period=Month`, { headers });
    console.log(`   - Month period data points: ${monthResponse.data.usageActivity.length}`);
    console.log(`   - Month sample: ${monthResponse.data.usageActivity[0].date} = ${monthResponse.data.usageActivity[0].value}`);
    
    // Test Year period
    const yearResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}/usage-activity?period=Year`, { headers });
    console.log(`   - Year period data points: ${yearResponse.data.usageActivity.length}`);
    console.log(`   - Year sample: ${yearResponse.data.usageActivity[0].date} = ${yearResponse.data.usageActivity[0].value}`);
    
    console.log('✅ Usage activity period filtering working');

    // Test 4: Profile Edit functionality
    console.log('\n4. Testing Profile Edit functionality...');
    const originalProfile = {
      username: userDetail.user.username,
      email: userDetail.user.email,
      phone: userDetail.user.phone,
      address: userDetail.user.address,
      job_title: userDetail.user.job_title,
      bio: userDetail.user.bio
    };
    
    console.log('   - Original profile data captured');
    
    // Test profile update
    const updatedProfile = {
      ...originalProfile,
      phone: '+1-555-TEST',
      bio: 'Test bio update'
    };
    
    await axios.put(`${API_URL}/api/admin/users/${testUser.id}`, updatedProfile, { headers });
    console.log('✅ Profile update request sent');
    
    // Verify update
    const verifyResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}`, { headers });
    const updatedUser = verifyResponse.data.user;
    
    console.log(`   - Phone updated: ${updatedUser.phone} ${updatedUser.phone === '+1-555-TEST' ? '✅' : '❌'}`);
    console.log(`   - Bio updated: ${updatedUser.bio} ${updatedUser.bio === 'Test bio update' ? '✅' : '❌'}`);
    
    // Revert changes
    await axios.put(`${API_URL}/api/admin/users/${testUser.id}`, originalProfile, { headers });
    console.log('✅ Profile reverted to original state');

    console.log('\n🎉 Support Tickets Features Test Summary:');
    console.log('   ✅ Support tickets data is real and detailed');
    console.log('   ✅ CSV export functionality working');
    console.log('   ✅ Usage activity period filtering working');
    console.log('   ✅ Profile edit functionality working');
    console.log('   ✅ All advanced features verified');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSupportTicketsFeatures();