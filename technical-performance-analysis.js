#!/usr/bin/env node
// Advanced Technical Performance Analysis

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

console.log('🔬 TECHNICAL PERFORMANCE ANALYSIS - CADUCEUS PROTOCOL');
console.log('=' .repeat(70));

async function performanceTest(endpoint, testName, iterations = 5) {
  console.log(`\n📊 Testing: ${testName}`);
  console.log(`Endpoint: ${endpoint}`);
  
  const results = [];
  let totalTime = 0;
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    const startTime = process.hrtime.bigint();
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      const isSuccess = response.ok;
      if (isSuccess) successCount++;
      
      results.push({
        iteration: i + 1,
        duration,
        status: response.status,
        success: isSuccess
      });
      
      totalTime += duration;
      
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      results.push({
        iteration: i + 1,
        duration,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      totalTime += duration;
    }
  }
  
  const avgTime = totalTime / iterations;
  const successRate = (successCount / iterations) * 100;
  const minTime = Math.min(...results.map(r => r.duration));
  const maxTime = Math.max(...results.map(r => r.duration));
  
  console.log(`Average Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`Min Time: ${minTime.toFixed(2)}ms`);
  console.log(`Max Time: ${maxTime.toFixed(2)}ms`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Throughput: ${(1000 / avgTime).toFixed(2)} req/sec`);
  
  return { avgTime, successRate, minTime, maxTime, results };
}

async function loadTest(endpoint, concurrency = 10) {
  console.log(`\n⚡ Load Test - ${concurrency} concurrent requests`);
  
  const startTime = process.hrtime.bigint();
  const promises = Array(concurrency).fill().map(async (_, i) => {
    const reqStart = process.hrtime.bigint();
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const reqEnd = process.hrtime.bigint();
      return {
        id: i,
        duration: Number(reqEnd - reqStart) / 1000000,
        status: response.status,
        success: response.ok
      };
    } catch (error) {
      const reqEnd = process.hrtime.bigint();
      return {
        id: i,
        duration: Number(reqEnd - reqStart) / 1000000,
        status: 'ERROR',
        success: false,
        error: error.message
      };
    }
  });
  
  const results = await Promise.all(promises);
  const endTime = process.hrtime.bigint();
  const totalTime = Number(endTime - startTime) / 1000000;
  
  const successful = results.filter(r => r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Successful Requests: ${successful}/${concurrency}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Requests per Second: ${(concurrency / (totalTime / 1000)).toFixed(2)}`);
  
  return { totalTime, successful, concurrency, avgResponseTime };
}

async function runAdvancedTests() {
  // Core API Performance Tests
  console.log('\n🚀 CORE API PERFORMANCE TESTS');
  await performanceTest('/api/representatives', 'Representatives API');
  await performanceTest('/api/dashboard/stats', 'Dashboard Statistics');
  await performanceTest('/api/invoices', 'Invoice Management');
  await performanceTest('/api/payments', 'Payment Processing');
  
  // AI Analytics Performance
  console.log('\n🤖 AI ANALYTICS PERFORMANCE');
  await performanceTest('/api/ai-analytics/debt-trends', 'AI Debt Analysis', 3);
  
  // Database Load Tests
  console.log('\n📊 DATABASE LOAD TESTS');
  await loadTest('/api/representatives', 5);
  await loadTest('/api/dashboard/stats', 10);
  
  // Memory and Resource Analysis
  console.log('\n💾 RESOURCE UTILIZATION ANALYSIS');
  
  const memUsage = process.memoryUsage();
  console.log(`Node.js Memory Usage:`);
  console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  
  // System Health Check
  console.log('\n🏥 SYSTEM HEALTH VALIDATION');
  
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('System Health:', healthData.status);
    console.log('Uptime:', new Date(healthData.timestamp));
  } catch (error) {
    console.log('Health Check Failed:', error.message);
  }
}

runAdvancedTests().then(() => {
  console.log('\n✅ ADVANCED TECHNICAL ANALYSIS COMPLETE');
}).catch(error => {
  console.error('💥 CRITICAL ERROR:', error);
});