const axios = require('axios');

async function testAdminLogin() {
  const API_URL = 'http://localhost:5000';
  
  try {
    console.log('🔍 Testing Admin Login Flow...\n');
    
    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    console.log('✅ Login successful!');
    console.log('👤 User:', loginResponse.data.user.username);
    console.log('🛡️ Role:', loginResponse.data.user.role);
    console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    
    const token = loginResponse.data.token;
    
    // Step 2: Test subscriptions analytics
    console.log('\n2️⃣ Testing subscriptions analytics...');
    const analyticsResponse = await axios.get(`${API_URL}/api/subscriptions/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Analytics API working!');
    console.log('📊 Total subscriptions:', analyticsResponse.data.totalSubscriptions);
    console.log('✅ Active plans:', analyticsResponse.data.activePlans);
    console.log('❌ Cancelled MTD:', analyticsResponse.data.canceledMTD);
    console.log('📈 Churn rate:', analyticsResponse.data.churnRate + '%');
    
    // Step 3: Test subscriptions list
    console.log('\n3️⃣ Testing subscriptions list...');
    const subscriptionsResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Subscriptions API working!');
    console.log('📋 Subscriptions found:', subscriptionsResponse.data.subscriptions.length);
    
    if (subscriptionsResponse.data.subscriptions.length > 0) {
      const firstSub = subscriptionsResponse.data.subscriptions[0];
      console.log('📄 Sample subscription:');
      console.log(`   - User: ${firstSub.user.name} (${firstSub.user.email})`);
      console.log(`   - Plan: ${firstSub.plan.name} - ${firstSub.plan.price}`);
      console.log(`   - Status: ${firstSub.status}`);
      console.log(`   - Billing: ${firstSub.billingCycle}`);
    }
    
    console.log('\n🎉 All tests passed! Admin login and APIs are working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Go to: http://localhost:3000/admin/login');
    console.log('2. Login with: admin@rayyan.com / password');
    console.log('3. Navigate to: http://localhost:3000/admin/subscriptions');
    console.log('4. You should see real data from the database!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminLogin();