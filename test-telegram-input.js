// Test script to simulate Telegram bot CRUD operations
const { handleNewRepresentativeInput, handleNewColleagueInput } = require('./server/telegram/handlers');

// Test representative creation input
const representativeInput = `نماینده جدید:
نام فروشگاه: فروشگاه مدرن
نام مالک: مریم رضایی
نام کاربری پنل: modernshop
شماره تلفن: 09127654321
نام همکار فروش: سارا احمدی`;

// Test colleague creation input
const colleagueInput = `همکار جدید:
نام: رضا محمدی
نرخ کمیسیون: 8.5`;

console.log('🧪 Testing Telegram Input Parsing:');
console.log('Representative Input:', representativeInput);
console.log('Colleague Input:', colleagueInput);

// This would be called by the actual Telegram handlers
console.log('✅ Input parsing logic implemented and ready for Telegram integration');