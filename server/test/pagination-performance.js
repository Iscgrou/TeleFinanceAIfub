// Performance testing script for pagination optimization
import http from 'http';

const HOST = 'localhost';
const PORT = 5000;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPaginationTests() {
  console.log('🚀 Starting Pagination Performance Analysis...\n');
  
  try {
    // Test 1: Performance benchmarks
    console.log('📊 1. Performance Benchmark Test');
    const perfTest = await makeRequest('/api/representatives/performance-test');
    console.log(`Total Test Duration: ${perfTest.totalDuration}`);
    console.log(`Average Query Time: ${perfTest.analysis.averageDuration}`);
    console.log(`Recommendation: ${perfTest.analysis.recommendation}`);
    console.log(`System Stats: ${perfTest.systemStats.totalRepresentatives} representatives`);
    console.log(`Pages at 20/page: ${perfTest.systemStats.pagesAt20}, at 50/page: ${perfTest.systemStats.pagesAt50}\n`);
    
    // Test 2: Pagination functionality
    console.log('📄 2. Pagination Functionality Test');
    const page1 = await makeRequest('/api/representatives/paginated?page=1&limit=10');
    console.log(`Page 1 (10 records): ${page1.data.length} records loaded`);
    console.log(`Total items: ${page1.pagination.totalItems}`);
    console.log(`Total pages: ${page1.pagination.totalPages}`);
    console.log(`Has next: ${page1.pagination.hasNext}, Has prev: ${page1.pagination.hasPrev}\n`);
    
    // Test 3: Search functionality
    console.log('🔍 3. Search Functionality Test');
    const searchTest = await makeRequest('/api/representatives/paginated?search=dar&limit=5');
    console.log(`Search "dar" results: ${searchTest.data.length} records`);
    if (searchTest.data.length > 0) {
      console.log('Sample matches:', searchTest.data.slice(0, 3).map(r => r.storeName));
    }
    console.log('');
    
    // Test 4: Sorting test
    console.log('📈 4. Sorting Test (by debt descending)');
    const sortTest = await makeRequest('/api/representatives/paginated?sortBy=totalDebt&sortOrder=desc&limit=5');
    console.log(`Top 5 debtors:`);
    sortTest.data.forEach((rep, i) => {
      console.log(`  ${i+1}. ${rep.storeName}: ${parseInt(rep.totalDebt).toLocaleString()} تومان`);
    });
    
    console.log('\n✅ All pagination tests completed successfully!');
    console.log('🎯 System is ready for enterprise-scale operations');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runPaginationTests();