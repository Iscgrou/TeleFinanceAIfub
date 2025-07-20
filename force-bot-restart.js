// Force bot restart with new token
const fetch = require('node-fetch');

async function forceRestartBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  console.log('🔧 Force Bot Restart Script');
  console.log('Token present:', !!botToken);
  console.log('Token preview:', botToken ? `${botToken.substring(0, 10)}...` : 'null');
  
  try {
    // Test new token directly
    console.log('🧪 Testing new token with Telegram API...');
    const testResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const testResult = await testResponse.json();
    console.log('API test result:', testResult);
    
    // Force restart via API
    console.log('🔄 Calling restart bot API...');
    const restartResponse = await fetch('http://localhost:5000/api/test/telegram/restart-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const restartResult = await restartResponse.json();
    console.log('Restart result:', restartResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

forceRestartBot();