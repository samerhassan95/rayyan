const mysql = require('mysql2/promise');
require('dotenv').config();

async function addRealisticSubscriptions() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'samerhassan11',
      database: process.env.DB_NAME || 'rayyan'
    });

    console.log('Adding realistic subscription data...');

    // First, let's check if we have plans
    const [plans] = await connection.execute('SELECT * FROM plans');
    if (plans.length === 0) {
      console.log('Adding plans first...');
      await connection.execute(`
        INSERT INTO plans (name, monthly_price, yearly_price, features) VALUES
        ('Starter', 19, 190, '["Basic features", "5 projects", "Email support"]'),
        ('Architect Pro', 49, 490, '["Advanced features", "Unlimited projects", "Priority support", "Analytics"]'),
        ('Enterprise', 120, 1200, '["All features", "Custom integrations", "Dedicated support", "Advanced analytics"]')
      `);
      console.log('Plans added successfully');
    }

    // Get plans and users
    const [plansData] = await connection.execute('SELECT * FROM plans');
    const [users] = await connection.execute('SELECT * FROM users WHERE role != "admin" LIMIT 50');

    if (users.length === 0) {
      console.log('No users found. Please add users first.');
      return;
    }

    // Clear existing subscriptions
    await connection.execute('DELETE FROM subscriptions');
    console.log('Cleared existing subscriptions');

    // Generate realistic subscription data
    const subscriptions = [];
    const statuses = ['active', 'active', 'active', 'active', 'active', 'past_due', 'cancelled'];
    const billingCycles = ['monthly', 'monthly', 'monthly', 'yearly'];

    for (let i = 0; i < Math.min(users.length, 45); i++) {
      const user = users[i];
      const plan = plansData[Math.floor(Math.random() * plansData.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const billingCycle = billingCycles[Math.floor(Math.random() * billingCycles.length)];
      
      // Calculate dates
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365)); // Random date in last year
      
      const currentPeriodStart = new Date(createdAt);
      const currentPeriodEnd = new Date(createdAt);
      const nextPaymentDate = new Date(createdAt);
      
      if (billingCycle === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }

      // Adjust for cancelled/past_due
      if (status === 'cancelled') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() - Math.floor(Math.random() * 30));
      } else if (status === 'past_due') {
        nextPaymentDate.setDate(nextPaymentDate.getDate() - Math.floor(Math.random() * 10));
      }

      const amount = billingCycle === 'yearly' ? plan.yearly_price : plan.monthly_price;

      subscriptions.push([
        user.id,
        plan.id,
        status,
        billingCycle,
        currentPeriodStart,
        currentPeriodEnd,
        nextPaymentDate,
        amount,
        createdAt,
        new Date()
      ]);
    }

    // Insert subscriptions
    for (const subscription of subscriptions) {
      await connection.execute(`
        INSERT INTO subscriptions 
        (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, next_payment_date, amount, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, subscription);
    }
    console.log(`Added ${subscriptions.length} realistic subscriptions`);

    // Add some transactions for revenue data
    console.log('Adding transaction data...');
    
    const transactions = [];
    const months = ['2023-05-01', '2023-06-01', '2023-07-01', '2023-08-01', '2023-09-01', '2023-10-01'];
    
    for (const month of months) {
      const monthlyTransactions = Math.floor(Math.random() * 200) + 100; // 100-300 transactions per month
      
      for (let i = 0; i < monthlyTransactions; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const plan = plansData[Math.floor(Math.random() * plansData.length)];
        const amount = Math.random() > 0.7 ? plan.yearly_price : plan.monthly_price;
        
        // Make sure amount is not null
        if (!amount || amount <= 0) continue;
        
        const transactionDate = new Date(month);
        transactionDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        transactions.push([
          user.id,
          null, // subscription_id
          amount,
          'USD',
          'successful',
          'credit_card',
          null, // payment_method_details
          `Payment for ${plan.name}`,
          amount * 0.03, // fees (3%)
          amount * 0.97, // net_amount
          transactionDate,
          transactionDate, // processed_at
          null, // refunded_at
          null, // refund_reason
          transactionDate
        ]);
      }
    }

    // Clear existing transactions and add new ones
    await connection.execute('DELETE FROM transactions WHERE description LIKE "Payment for%"');
    
    for (const transaction of transactions) {
      await connection.execute(`
        INSERT INTO transactions 
        (user_id, subscription_id, amount, currency, status, payment_method, payment_method_details, description, fees, net_amount, transaction_date, processed_at, refunded_at, refund_reason, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, transaction);
    }
    console.log(`Added ${transactions.length} transaction records`);

    // Show summary
    const [subCount] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions');
    const [activeCount] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"');
    const [pastDueCount] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "past_due"');
    const [cancelledCount] = await connection.execute('SELECT COUNT(*) as count FROM subscriptions WHERE status = "cancelled"');

    console.log('\n=== SUBSCRIPTION SUMMARY ===');
    console.log(`Total subscriptions: ${subCount[0].count}`);
    console.log(`Active: ${activeCount[0].count}`);
    console.log(`Past due: ${pastDueCount[0].count}`);
    console.log(`Cancelled: ${cancelledCount[0].count}`);

    await connection.end();
    console.log('✅ Realistic subscription data added successfully!');

  } catch (error) {
    console.error('Error adding subscription data:', error);
  }
}

addRealisticSubscriptions();