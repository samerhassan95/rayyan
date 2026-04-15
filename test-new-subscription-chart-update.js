const axios = require('axios');

async function testNewSubscriptionChartUpdate() {
  try {
    console.log('🧪 Testing New Subscription Chart Update...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get analytics before creating subscription
    console.log('📊 BEFORE: Getting current analytics...');
    const beforeAnalytics = await axios.get('http://localhost:5000/api/subscriptions/analytics', { headers });
    
    console.log('Revenue Growth Data (BEFORE):');
    if (beforeAnalytics.data.revenueGrowth && beforeAnalytics.data.revenueGrowth.length > 0) {
      beforeAnalytics.data.revenueGrowth.forEach((month, index) => {
        console.log(`   ${index + 1}. ${month.month}: $${month.revenue.toLocaleString()}`);
      });
    }
    
    const beforeTotal = beforeAnalytics.data.totalSubscriptions;
    console.log(`Total subscriptions BEFORE: ${beforeTotal}`);

    // Create new subscription
    console.log('\n➕ CREATING: New subscription...');
    const newSubscription = await axios.post('http://localhost:5000/api/subscriptions', {
      userEmail: 'test-chart-update@example.com',
      planId: 2, // Professional plan
      billingCycle: 'monthly'
    }, { headers });

    console.log(`✅ Created subscription: ${newSubscription.data.subscription.user.email}`);

    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get analytics after creating subscription
    console.log('\n📊 AFTER: Getting updated analytics...');
    const afterAnalytics = await axios.get('http://localhost:5000/api/subscriptions/analytics', { headers });
    
    console.log('Revenue Growth Data (AFTER):');
    if (afterAnalytics.data.revenueGrowth && afterAnalytics.data.revenueGrowth.length > 0) {
      afterAnalytics.data.revenueGrowth.forEach((month, index) => {
        console.log(`   ${index + 1}. ${month.month}: $${month.revenue.toLocaleString()}`);
      });
    }
    
    const afterTotal = afterAnalytics.data.totalSubscriptions;
    console.log(`Total subscriptions AFTER: ${afterTotal}`);

    // Compare results
    console.log('\n🔍 COMPARISON:');
    console.log(`- Subscriptions increased: ${beforeTotal} → ${afterTotal} (+${afterTotal - beforeTotal})`);
    
    // Check if current month revenue increased
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const beforeCurrentMonth = beforeAnalytics.data.revenueGrowth?.find(m => m.month === currentMonth);
    const afterCurrentMonth = afterAnalytics.data.revenueGrowth?.find(m => m.month === currentMonth);
    
    if (beforeCurrentMonth && afterCurrentMonth) {
      const revenueDiff = afterCurrentMonth.revenue - beforeCurrentMonth.revenue;
      console.log(`- ${currentMonth} revenue increased: $${beforeCurrentMonth.revenue.toLocaleString()} → $${afterCurrentMonth.revenue.toLocaleString()} (+$${revenueDiff.toLocaleString()})`);
      
      if (revenueDiff > 0) {
        console.log('✅ SUCCESS: Chart will update with new revenue data!');
      } else {
        console.log('❌ ISSUE: Revenue did not increase as expected');
      }
    } else if (!beforeCurrentMonth && afterCurrentMonth) {
      console.log(`- New ${currentMonth} revenue: $${afterCurrentMonth.revenue.toLocaleString()}`);
      console.log('✅ SUCCESS: New month added to chart!');
    } else {
      console.log('⚠️  Could not compare current month revenue');
    }

    console.log('\n🎯 RESULT:');
    console.log('The chart should now show updated revenue data including the new subscription payment.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewSubscriptionChartUpdate();