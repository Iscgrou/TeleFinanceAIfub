import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { handleMessage, handleCallbackQuery, handleDocument } from './handlers';
import { TelegramIntegration } from '../services/telegram-integration';

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

  console.log('🔍 Reading bot token from database and environment...');
  const settings = await storage.getSystemSettings();
  const dbToken = settings?.telegramBotToken;
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  
  console.log('📊 Token sources:', {
    database: dbToken ? `${dbToken.substring(0, 10)}...` : 'null',
    environment: envToken ? `${envToken.substring(0, 10)}...` : 'null'
  });
  
  const botToken = envToken || dbToken; // Prioritize environment variable
  
  if (!botToken) {
    console.log('❌ Telegram bot token not configured. Bot will not start.');
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
    
    // Initialize advanced feature commands
    TelegramIntegration.initializeAdvancedCommands();
    
    bot.on('polling_error', async (error) => {
      console.error('Telegram polling error:', error);
      
      // Handle conflict errors with smart recovery
      if ((error as any).code === 'EFATAL' || error.message.includes('409')) {
        console.log('🔄 Bot conflict detected. Implementing recovery strategy...');
        
        // Force stop current instance
        await stopBot();
        isInitializing = false;
        
        // Wait longer delay to clear conflicts
        setTimeout(async () => {
          console.log('🔄 Attempting smart bot restart after conflict resolution...');
          try {
            await initializeBot();
            console.log('✅ Bot restarted successfully');
          } catch (err) {
            console.error('❌ Smart restart failed:', err);
          }
        }, 60000); // 60 second delay for full cleanup
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
    console.log('🛑 Force stopping existing bot instance...');
    try {
      // Remove all listeners first
      bot.removeAllListeners();
      
      // Force stop polling with cancel
      await bot.stopPolling({ cancel: true, reason: 'Force restart with new token' });
      
      // Force close
      if (typeof bot.close === 'function') {
        await bot.close();
      }
      
      console.log('✅ Bot stopped successfully');
    } catch (e) {
      console.log('⚠️ Error stopping polling (forcing anyway):', (e as Error).message);
    }
    
    bot = null;
    
    // Give extra time for cleanup
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

export { bot };

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
