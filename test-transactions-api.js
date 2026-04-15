const axios = require('axios');

async function testTransactionsAPI() {
  try {
    console.log('💰 Testing Transactions API...\n');

    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test transactions endpoint
    console.log('📊 TESTING TRANSACTIONS ENDPOINT:');
    try {
      const transactionsResponse = await axios.get('http://localhost:5000/api/transactions', { headers });
      console.log('✅ Transactions API Response:');
      console.log(`- Total transactions: ${transactionsResponse.data.transactions?.length || 0}`);
      console.log(`- Pagination total: ${transactionsResponse.data.pagination?.total || 0}`);
      
      if (transactionsResponse.data.transactions && transactionsResponse.data.transactions.length > 0) {
        console.log('- Sample transactions:');
        transactionsResponse.data.transactions.slice(0, 3).forEach((txn, index) => {
          console.log(`  ${index + 1}. ${txn.user.name}: $${txn.amount} (${txn.status})`);
        });
      } else {
        console.log('- No transactions found in response');
      }
    } catch (error) {
      console.log('❌ Transactions endpoint error:', error.response?.data || error.message);
    }

    // Test analytics endpoint
    console.log('\n📈 TESTING ANALYTICS ENDPOINT:');
    try {
      const analyticsResponse = await axios.get('http://localhost:5000/api/transactions/analytics', { headers });
      console.log('✅ Analytics API Response:');
      console.log(`- Total Revenue: $${analyticsResponse.data.totalRevenue?.toLocaleString() || 0}`);
      console.log(`- Monthly Volume: $${analyticsResponse.data.monthlyVolume?.toLocaleString() || 0}`);
      console.log(`- Failed Transactions: ${analyticsResponse.data.failedTransactions || 0}%`);
      console.log(`- Revenue Growth: ${analyticsResponse.data.revenueGrowth || 0}%`);
      console.log(`- Revenue Data Points: ${analyticsResponse.data.revenueData?.length || 0}`);
    } catch (error) {
      console.log('❌ Analytics endpoint error:', error.response?.data || error.message);
    }

    // Check if we have transactions in database
    console.log('\n🔍 CHECKING DATABASE TRANSACTIONS:');
    try {
      // Get all transactions to see what's in the database
      const allTransactionsResponse = await axios.get('http://localhost:5000/api/transactions?limit=100', { headers });
      console.log(`- Database has ${allTransactionsResponse.data.pagination?.total || 0} total transactions`);
      
      if (allTransactionsResponse.data.transactions && allTransactionsResponse.data.transactions.length > 0) {
        console.log('- Recent transactions:');
        allTransactionsResponse.data.transactions.slice(0, 5).forEach((txn, index) => {
          console.log(`  ${index + 1}. ID: ${txn.id}, User: ${txn.user.name}, Amount: $${txn.amount}, Status: ${txn.status}, Date: ${txn.date}`);
        });
      } else {
        console.log('❌ No transactions found in database!');
        console.log('This is why the transactions page is empty.');
      }
    } catch (error) {
      console.log('❌ Database check error:', error.response?.data || error.message);
    }

    console.log('\n🎯 DIAGNOSIS:');
    console.log('If no transactions are found, the page will be empty.');
    console.log('We need to ensure there are transactions in the database.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTransactionsAPI();