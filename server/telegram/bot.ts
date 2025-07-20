import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { handleMessage, handleCallbackQuery, handleDocument } from './handlers';

let bot: TelegramBot | null = null;
let isInitializing = false;
let restartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;

export async function initializeBot(): Promise<void> {
  // Prevent multiple initialization attempts
  if (isInitializing) {
    console.log('Bot initialization already in progress, skipping...');
    return;
  }

  const settings = await storage.getSystemSettings();
  const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.log('Telegram bot token not configured. Bot will not start.');
    return;
  }

  isInitializing = true;

  try {
    // Stop any existing bot instance first
    await stopBot();

    // Clear any webhooks that might be interfering
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    console.log('Webhook cleanup:', await webhookResponse.json());

    // Wait longer before starting new instance to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 3000));

    bot = new TelegramBot(botToken, { 
      polling: {
        interval: 3000, // Increased interval to reduce conflicts
        autoStart: false, // Manual start to have better control
        params: {
          timeout: 10
        }
      }
    });
    
    bot.on('message', handleMessage);
    bot.on('callback_query', handleCallbackQuery);
    bot.on('document', handleDocument);
    
    bot.on('polling_error', async (error) => {
      console.error('Telegram polling error:', error);
      
      // Handle conflict errors - disable auto-restart to prevent infinite loops
      if (error.code === 'EFATAL' || error.message.includes('409')) {
        console.error('Telegram bot conflict detected (409). Auto-restart disabled to prevent loops.');
        console.log('This usually means another bot instance is running elsewhere.');
        console.log('Solutions:');
        console.log('1. Wait a few minutes and manually restart via /api/test/telegram/restart-bot');
        console.log('2. Use direct messaging via /api/test/telegram/send-message for immediate functionality');
        console.log('3. Check for other running instances of this application');
        isInitializing = false;
        await stopBot(); // Force cleanup
      }
    });

    // Start polling manually
    await bot.startPolling();
    restartAttempts = 0; // Reset counter on successful start
    console.log('Telegram bot initialized and polling started successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    restartAttempts++;
  } finally {
    isInitializing = false;
  }
}

async function stopBot(): Promise<void> {
  if (bot) {
    console.log('Stopping existing bot instance...');
    try {
      await bot.stopPolling();
      // Give extra time for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      console.log('Error stopping polling:', e.message);
    }
    bot = null;
  }
}

export async function stopBotInstance(): Promise<void> {
  await stopBot();
  isInitializing = false;
  restartAttempts = 0;
  console.log('Bot instance stopped and state reset');
}

export function getBot(): TelegramBot | null {
  return bot;
}

export async function sendMessage(chatId: string, text: string, options?: any): Promise<void> {
  if (!bot) {
    throw new Error('Bot not initialized');
  }
  
  try {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      ...options
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function sendInlineKeyboard(chatId: string, text: string, keyboard: any[][]): Promise<void> {
  await sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}
