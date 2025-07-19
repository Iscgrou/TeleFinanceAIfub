// Script to generate test data with 500 admins
import { writeFileSync } from 'fs';

function generateLargeUsageFile(adminCount: number = 500, transactionsPerAdmin: number = 5) {
  const data: any[] = [];
  const baseTime = new Date('2025-01-19T10:00:00Z');
  
  // Generate transactions for each admin
  for (let adminIdx = 1; adminIdx <= adminCount; adminIdx++) {
    const adminUsername = `admin_${adminIdx.toString().padStart(3, '0')}`;
    
    for (let txIdx = 0; txIdx < transactionsPerAdmin; txIdx++) {
      const transactionTime = new Date(baseTime.getTime() + (adminIdx * 60000) + (txIdx * 5000));
      const gigabytes = Math.floor(Math.random() * 150) + 10;
      const months = Math.floor(Math.random() * 3) + 1;
      const amount = (gigabytes * 900 * months).toFixed(2);
      
      data.push({
        admin_username: adminUsername,
        event_timestamp: transactionTime.toISOString().replace('T', ' ').replace('.000Z', ''),
        event_type: "CREATE",
        description: `ایجاد کاربر: user_${adminIdx}_${txIdx} (${months} ماهه, ${gigabytes}.0 گیگ)`,
        amount: amount
      });
    }
  }
  
  // Create the full JSON structure
  const fullJson = [
    {
      type: "header",
      version: "5.2.2",
      comment: "Export to JSON plugin for PHPMyAdmin"
    },
    {
      type: "database",
      name: "marzban"
    },
    {
      type: "table",
      name: "a",
      database: "marzban",
      data: data
    }
  ];
  
  return fullJson;
}

// Generate and save the file
const largeUsageData = generateLargeUsageFile(500, 5); // 500 admins, 5 transactions each
writeFileSync('large-usage-500-admins.json', JSON.stringify(largeUsageData, null, 2));

console.log('Generated large-usage-500-admins.json with:');
console.log(`- ${500} admins`);
console.log(`- ${500 * 5} total transactions`);
console.log(`- File size: ${(JSON.stringify(largeUsageData).length / 1024 / 1024).toFixed(2)} MB`);