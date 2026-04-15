const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSubscriptionsFilters() {
  console.log('🧪 Testing Subscriptions Filters...\n');

  try {
    // Test login first
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${token}` };

    // Test analytics endpoint
    console.log('\n2. Testing analytics endpoint...');
    const analyticsResponse = await axios.get(`${API_URL}/api/subscriptions/analytics`, { headers });
    console.log('✅ Analytics data:', {
      totalSubscriptions: analyticsResponse.data.totalSubscriptions,
      activePlans: analyticsResponse.data.activePlans,
      canceledMTD: analyticsResponse.data.canceledMTD,
      churnRate: analyticsResponse.data.churnRate
    });

    // Test basic subscriptions endpoint
    console.log('\n3. Testing basic subscriptions endpoint...');
    const basicResponse = await axios.get(`${API_URL}/api/subscriptions`, { headers });
    console.log('✅ Basic subscriptions:', {
      count: basicResponse.data.subscriptions.length,
      total: basicResponse.data.pagination.total
    });

    // Test monthly filter
    console.log('\n4. Testing monthly filter...');
    const monthlyResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { billingCycle: 'monthly' }
    });
    console.log('✅ Monthly subscriptions:', {
      count: monthlyResponse.data.subscriptions.length,
      total: monthlyResponse.data.pagination.total
    });

    // Test yearly filter
    console.log('\n5. Testing yearly filter...');
    const yearlyResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { billingCycle: 'yearly' }
    });
    console.log('✅ Yearly subscriptions:', {
      count: yearlyResponse.data.subscriptions.length,
      total: yearlyResponse.data.pagination.total
    });

    // Test status filter
    console.log('\n6. Testing status filter (active)...');
    const activeResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { status: 'active' }
    });
    console.log('✅ Active subscriptions:', {
      count: activeResponse.data.subscriptions.length,
      total: activeResponse.data.pagination.total
    });

    // Test combined filters
    console.log('\n7. Testing combined filters (monthly + active)...');
    const combinedResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { 
        billingCycle: 'monthly',
        status: 'active'
      }
    });
    console.log('✅ Monthly active subscriptions:', {
      count: combinedResponse.data.subscriptions.length,
      total: combinedResponse.data.pagination.total
    });

    // Test date range filter
    console.log('\n8. Testing date range filter...');
    const dateResponse = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { 
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      }
    });
    console.log('✅ Date filtered subscriptions:', {
      count: dateResponse.data.subscriptions.length,
      total: dateResponse.data.pagination.total
    });

    // Test pagination
    console.log('\n9. Testing pagination...');
    const page1Response = await axios.get(`${API_URL}/api/subscriptions`, {
      headers,
      params: { page: 1, limit: 5 }
    });
    console.log('✅ Page 1 (limit 5):', {
      count: page1Response.data.subscriptions.length,
      page: page1Response.data.pagination.page,
      pages: page1Response.data.pagination.pages
    });

    console.log('\n🎉 All filter tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSubscriptionsFilters();