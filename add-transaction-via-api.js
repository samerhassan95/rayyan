const axios = require('axios');

async function addTransactionViaAPI() {
  try {
    console.log('💰 Adding transaction via API for User ID 27...\n');

    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Create a new subscription for user 27 (this will create a transaction automatically)
    console.log('📝 Creating subscription for user 27...');
    
    try {
      const subscriptionResponse = await axios.post('http://localhost:5000/api/subscriptions', {
        userEmail: 'superadmin@superadmin.com',
        planId: 2, // Professional plan
        billingCycle: 'monthly'
      }, { headers });

      console.log('✅ Subscription created successfully!');
      console.log(`- User: ${subscriptionResponse.data.subscription.user.email}`);
      console.log(`- Plan: ${subscriptionResponse.data.subscription.plan.name}`);
      console.log(`- Price: ${subscriptionResponse.data.subscription.plan.price}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('⚠️  User already has subscription, that\'s fine');
      } else {
        throw error;
      }
    }

    // Test the user detail again to see updated data
    console.log('\n📊 Testing updated user data...');
    const userResponse = await axios.get('http://localhost:5000/api/admin/users/27', { headers });
    
    console.log('✅ Updated Statistics:');
    const stats = userResponse.data.statistics;
    console.log(`- Total Payments: $${stats.totalPayments}`);
    console.log(`- Active Subscriptions: ${stats.activeSubscriptions}`);
    console.log(`- Total Spend: $${stats.totalSpend}`);
    console.log(`- Open Tickets: ${stats.openTickets}`);

    console.log('\n🎯 RESULT:');
    if (parseFloat(stats.totalPayments) > 0) {
      console.log('✅ SUCCESS: User now has real payment data!');
      console.log('✅ The charts and statistics will show real data from the database');
    } else {
      console.log('⚠️  User still has no payments, but subscription is active');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

addTransactionViaAPI();