#!/usr/bin/env node
// Comprehensive System Testing Suite - CADUCEUS Protocol v1.0
// Technical Validation of All Components

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS = {
  telegram: { passed: 0, failed: 0, details: [] },
  api: { passed: 0, failed: 0, details: [] },
  database: { passed: 0, failed: 0, details: [] },
  payments: { passed: 0, failed: 0, details: [] },
  invoices: { passed: 0, failed: 0, details: [] },
  alerts: { passed: 0, failed: 0, details: [] },
  ai: { passed: 0, failed: 0, details: [] },
  realtime: { passed: 0, failed: 0, details: [] }
};

console.log('🔬 CADUCEUS PROTOCOL COMPREHENSIVE TECHNICAL TESTING');
console.log('=' .repeat(60));

// Helper function for API calls
async function apiTest(category, testName, endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const data = await response.json();
    const success = response.ok && data;
    
    TEST_RESULTS[category][success ? 'passed' : 'failed']++;
    TEST_RESULTS[category].details.push({
      test: testName,
      status: success ? 'PASS' : 'FAIL',
      endpoint,
      response: success ? 'OK' : `${response.status}: ${data?.error || 'Unknown error'}`
    });
    
    console.log(`${success ? '✅' : '❌'} ${testName}: ${success ? 'PASS' : 'FAIL'}`);
    return { success, data, response };
  } catch (error) {
    TEST_RESULTS[category].failed++;
    TEST_RESULTS[category].details.push({
      test: testName,
      status: 'ERROR',
      endpoint,
      response: error.message
    });
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
    return { success: false, error };
  }
}

async function runComprehensiveTests() {
  console.log('\n📱 TELEGRAM BOT FUNCTIONALITY TESTS');
  console.log('-'.repeat(40));
  
  // Telegram Bot Tests
  await apiTest('telegram', 'Bot Status Check', '/api/test/telegram/status');
  await apiTest('telegram', 'Bot getMe Validation', '/api/telegram/me');
  
  console.log('\n🔗 API ENDPOINTS FUNCTIONALITY TESTS');
  console.log('-'.repeat(40));
  
  // Core API Tests
  await apiTest('api', 'Representatives List', '/api/representatives');
  await apiTest('api', 'Dashboard Statistics', '/api/dashboard/stats');
  await apiTest('api', 'System Settings', '/api/settings');
  await apiTest('api', 'Sales Colleagues', '/api/sales-colleagues');
  
  console.log('\n💾 DATABASE OPERATIONS TESTS');
  console.log('-'.repeat(40));
  
  // Database Tests
  const repsResult = await apiTest('database', 'Representatives Data Retrieval', '/api/representatives');
  if (repsResult.success && repsResult.data?.data?.length > 0) {
    const firstRep = repsResult.data.data[0];
    await apiTest('database', 'Individual Representative Data', `/api/representatives/${firstRep.id}`);
  }
  
  console.log('\n💰 PAYMENT SYSTEM TESTS');
  console.log('-'.repeat(40));
  
  // Payment Tests
  await apiTest('payments', 'Payment History', '/api/payments');
  await apiTest('payments', 'Invoice History', '/api/invoices');
  
  console.log('\n📄 INVOICE GENERATION TESTS');
  console.log('-'.repeat(40));
  
  // Invoice Tests
  await apiTest('invoices', 'Invoice Templates', '/api/invoice-templates');
  const invoicesResult = await apiTest('invoices', 'Invoice List', '/api/invoices');
  if (invoicesResult.success && invoicesResult.data?.length > 0) {
    const firstInvoice = invoicesResult.data[0];
    await apiTest('invoices', 'Invoice Image Generation', `/api/test/invoice/${firstInvoice.id}`);
  }
  
  console.log('\n🚨 ALERT SYSTEM TESTS');
  console.log('-'.repeat(40));
  
  // Alert Tests
  await apiTest('alerts', 'Alert Rules', '/api/alerts/rules');
  await apiTest('alerts', 'Alert History', '/api/alerts/history');
  await apiTest('alerts', 'Alert Statistics', '/api/alerts/stats');
  
  console.log('\n🤖 AI ANALYTICS TESTS');
  console.log('-'.repeat(40));
  
  // AI Analytics Tests
  await apiTest('ai', 'Debt Trend Analysis', '/api/ai-analytics/debt-trends');
  await apiTest('ai', 'Risk Assessment', '/api/ai-analytics/risk-assessment');
  await apiTest('ai', 'Performance Metrics', '/api/ai-analytics/performance-metrics');
  await apiTest('ai', 'Recommendations', '/api/ai-analytics/recommendations');
  
  console.log('\n⚡ REAL-TIME FEATURES TESTS');
  console.log('-'.repeat(40));
  
  // Real-time Tests
  await apiTest('realtime', 'WebSocket Health', '/api/health');
  await apiTest('realtime', 'Live Dashboard Data', '/api/dashboard/live');
  
  // Generate Test Report
  console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  Object.keys(TEST_RESULTS).forEach(category => {
    const result = TEST_RESULTS[category];
    const total = result.passed + result.failed;
    const successRate = total > 0 ? (result.passed / total * 100).toFixed(1) : 0;
    
    console.log(`${category.toUpperCase()}: ${result.passed}/${total} (${successRate}%)`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  });
  
  const overallSuccess = totalPassed + totalFailed > 0 ? (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1) : 0;
  
  console.log('\n🎯 OVERALL SYSTEM HEALTH');
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success Rate: ${overallSuccess}%`);
  
  // Detailed Failure Analysis
  if (totalFailed > 0) {
    console.log('\n🔍 DETAILED FAILURE ANALYSIS');
    console.log('-'.repeat(40));
    
    Object.keys(TEST_RESULTS).forEach(category => {
      const failures = TEST_RESULTS[category].details.filter(d => d.status !== 'PASS');
      if (failures.length > 0) {
        console.log(`\n${category.toUpperCase()} Failures:`);
        failures.forEach(failure => {
          console.log(`  ❌ ${failure.test}: ${failure.response}`);
        });
      }
    });
  }
  
  return {
    totalTests: totalPassed + totalFailed,
    passed: totalPassed,
    failed: totalFailed,
    successRate: overallSuccess,
    details: TEST_RESULTS
  };
}

// Execute tests
runComprehensiveTests().then(results => {
  console.log('\n✅ TESTING COMPLETE');
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('💥 CRITICAL TEST FAILURE:', error);
  process.exit(1);
});