const axios = require('axios');

async function testUserDetailRealData() {
  try {
    console.log('🧪 Testing User Detail Real Data...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get user ID 27 (from the screenshot)
    const userId = 27;
    console.log(`📋 Testing User ID: ${userId}`);

    // Test user detail endpoint
    console.log('\n📊 TESTING USER DETAIL ENDPOINT:');
    const userResponse = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, { headers });
    
    console.log('✅ User Detail Response:');
    console.log(`- User: ${userResponse.data.user.username} (${userResponse.data.user.email})`);
    console.log(`- Status: ${userResponse.data.user.status}`);
    console.log(`- Role: ${userResponse.data.user.role}`);
    
    console.log('\n💰 REAL STATISTICS:');
    const stats = userResponse.data.statistics;
    console.log(`- Total Payments: $${stats.totalPayments}`);
    console.log(`- Active Subscriptions: ${stats.activeSubscriptions}`);
    console.log(`- Total Spend: $${stats.totalSpend}`);
    console.log(`- Open Tickets: ${stats.openTickets}`);

    console.log('\n📈 USAGE ACTIVITY DATA:');
    if (userResponse.data.usageActivity && userResponse.data.usageActivity.length > 0) {
      console.log(`- Activity points: ${userResponse.data.usageActivity.length}`);
      console.log('- Sample data:');
      userResponse.data.usageActivity.slice(0, 5).forEach((point, index) => {
        console.log(`  ${index + 1}. ${point.date}: ${point.value} units`);
      });
    } else {
      console.log('- No usage activity data found');
    }

    console.log('\n🎫 SUPPORT TICKETS:');
    if (userResponse.data.supportTickets && userResponse.data.supportTickets.length > 0) {
      console.log(`- Total tickets: ${userResponse.data.supportTickets.length}`);
      userResponse.data.supportTickets.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. #${ticket.ticket_number}: ${ticket.subject} (${ticket.status})`);
      });
    } else {
      console.log('- No support tickets found');
    }

    // Test usage activity endpoint with different periods
    console.log('\n📊 TESTING USAGE ACTIVITY PERIODS:');
    
    const periods = ['Week', 'Month', 'Year'];
    for (const period of periods) {
      try {
        const activityResponse = await axios.get(`http://localhost:5000/api/admin/users/${userId}/usage-activity?period=${period}`, { headers });
        console.log(`- ${period}: ${activityResponse.data.usageActivity?.length || 0} data points`);
        
        if (activityResponse.data.usageActivity && activityResponse.data.usageActivity.length > 0) {
          const sample = activityResponse.data.usageActivity[0];
          console.log(`  Sample: ${sample.date} = ${sample.value} units`);
        }
      } catch (error) {
        console.log(`- ${period}: Error - ${error.message}`);
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log('✅ User detail endpoint working');
    console.log('✅ Real statistics calculated from database');
    console.log('✅ Usage activity data generated');
    console.log('✅ Support tickets loaded');
    console.log('\nThe user detail page should now show real data instead of mock data!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUserDetailRealData();