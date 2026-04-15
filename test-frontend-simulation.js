const axios = require('axios');

async function simulateFrontendBehavior() {
  try {
    console.log('🎭 Simulating Frontend Behavior...\n');

    // Step 1: Login (like frontend does)
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('- Token exists:', !!token);
    console.log('- User role:', user.role);

    // Step 2: Make the exact same API calls as frontend
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n2. Fetching subscriptions (like frontend)...');
    
    // This is the exact call the frontend makes
    const [subsResponse, analyticsResponse] = await Promise.all([
      axios.get('http://localhost:5000/api/subscriptions', {
        headers,
        params: {
          billingCycle: 'monthly',  // Default filter
          status: '',               // No status filter
          page: 1,                  // First page
          startDate: '2026-01-01',  // Updated date range
          endDate: '2026-12-31'
        }
      }),
      axios.get('http://localhost:5000/api/subscriptions/analytics', { headers })
    ]);

    console.log('✅ API Responses received');
    
    // Step 3: Check what frontend would see
    console.log('\n3. Frontend would see:');
    console.log('- Subscriptions array length:', subsResponse.data.subscriptions?.length || 0);
    console.log('- Analytics total:', analyticsResponse.data.totalSubscriptions || 0);
    
    if (subsResponse.data.subscriptions && subsResponse.data.subscriptions.length > 0) {
      console.log('- First subscription:', subsResponse.data.subscriptions[0]);
      console.log('\n✅ Frontend should show data!');
    } else {
      console.log('- No subscriptions returned');
      console.log('- Response structure:', Object.keys(subsResponse.data));
      console.log('\n❌ This is why frontend shows "No Subscriptions Found"');
    }

    // Step 4: Try without filters
    console.log('\n4. Trying without any filters...');
    const noFilterResponse = await axios.get('http://localhost:5000/api/subscriptions', {
      headers
    });
    
    console.log('- Without filters, got:', noFilterResponse.data.subscriptions?.length || 0, 'subscriptions');

  } catch (error) {
    console.error('❌ Simulation failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Authentication issue - token might be invalid');
    }
  }
}

simulateFrontendBehavior();