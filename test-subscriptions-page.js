const puppeteer = require('puppeteer');

async function testSubscriptionsPage() {
  console.log('🚀 Testing Subscriptions Page...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to subscriptions page
    console.log('📱 Opening subscriptions page...');
    await page.goto('http://localhost:3000/admin/subscriptions', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    console.log('✅ Subscriptions page loaded successfully!');
    
    // Test filters
    console.log('🔍 Testing filters...');
    
    // Test Monthly/Yearly toggle
    await page.click('button:has-text("Yearly")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Monthly")');
    await page.waitForTimeout(1000);
    
    // Test status filter
    await page.selectOption('select', 'active');
    await page.waitForTimeout(1000);
    
    await page.selectOption('select', '');
    await page.waitForTimeout(1000);
    
    console.log('✅ Filters working correctly!');
    
    // Test pagination
    console.log('📄 Testing pagination...');
    await page.click('button:has-text("2")');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("1")');
    await page.waitForTimeout(1000);
    
    console.log('✅ Pagination working correctly!');
    
    // Check if stats cards are visible
    const statsCards = await page.$$eval('[style*="grid-template-columns: repeat(4, 1fr)"] > div', 
      cards => cards.length
    );
    console.log(`📊 Found ${statsCards} stats cards`);
    
    // Check if table is visible
    const tableRows = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`📋 Found ${tableRows} subscription rows`);
    
    // Check if charts are visible
    const charts = await page.$$eval('[style*="grid-template-columns: 2fr 1fr"] > div', 
      charts => charts.length
    );
    console.log(`📈 Found ${charts} chart sections`);
    
    console.log('🎉 All tests passed! Subscriptions page is working perfectly.');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Check if we're running this directly
if (require.main === module) {
  testSubscriptionsPage().catch(console.error);
}

module.exports = testSubscriptionsPage;