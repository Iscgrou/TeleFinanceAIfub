import fs from 'fs';

async function testUsageProcessor() {
  try {
    // Read the sample usage file
    const usageData = fs.readFileSync('sample-usage.json', 'utf8');
    
    console.log('🔍 Sending request to http://localhost:5000/api/debug/process-usage');
    
    // Make the API call
    const response = await fetch('http://localhost:5000/api/debug/process-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usageData })
    });
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response headers:', response.headers);
    
    const text = await response.text();
    console.log('📋 Raw response:', text.substring(0, 200) + '...');
    
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const result = JSON.parse(text);
      console.log('\n📊 Test Result:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Unexpected response:', text);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Wait a bit for server to start
setTimeout(testUsageProcessor, 2000);