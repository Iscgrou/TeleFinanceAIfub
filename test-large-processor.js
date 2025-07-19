import fs from 'fs';

async function testLargeFileProcessor() {
  try {
    // Read the large usage file (500 admins)
    const usageData = fs.readFileSync('large-usage-500-admins.json', 'utf8');
    
    console.log('🔍 Testing large file with 500 admins...');
    console.log('📋 File size:', usageData.length, 'characters');
    console.log('📋 Transaction count:', (usageData.match(/admin_username/g) || []).length);
    
    // Make the API call
    const startTime = Date.now();
    const response = await fetch('http://localhost:5000/api/debug/process-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usageData })
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log('⏱️  Processing time:', processingTime, 'ms');
    console.log('📋 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n📊 Large Scale Test Result:');
      console.log('  Success:', result.processResult.success);
      console.log('  Invoices created:', result.processResult.invoicesCreated);
      console.log('  Total amount:', result.processResult.totalAmount);
      console.log('  Representatives in DB:', result.databaseState.representatives);
      console.log('  Processing rate:', Math.round(result.processResult.invoicesCreated / (processingTime / 1000)), 'invoices/second');
    } else {
      const error = await response.text();
      console.error('❌ Request failed:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Wait for server to be ready
setTimeout(testLargeFileProcessor, 3000);