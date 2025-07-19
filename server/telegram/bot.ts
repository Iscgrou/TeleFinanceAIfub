import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { handleMessage, handleCallbackQuery, handleDocument } from './handlers';

let bot: TelegramBot | null = null;

export async function initializeBot(): Promise<void> {
  const settings = await storage.getSystemSettings();
  const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.log('Telegram bot token not configured. Bot will not start.');
    return;
  }

  try {
    // Stop any existing bot instance first
    if (bot) {
      console.log('Stopping existing bot instance...');
      try {
        await bot.stopPolling();
      } catch (e) {
        console.log('No existing polling to stop');
      }
      bot = null;
    }

    // Clear any webhooks that might be interfering
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    console.log('Webhook cleanup:', await webhookResponse.json());

    // Wait a moment before starting new instance
    await new Promise(resolve => setTimeout(resolve, 1000));

    bot = new TelegramBot(botToken, { 
      polling: {
        interval: 2000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    bot.on('message', handleMessage);
    bot.on('callback_query', handleCallbackQuery);
    bot.on('document', handleDocument);
    
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
      // Auto-restart on conflict errors
      if (error.code === 'EFATAL' || error.message.includes('409')) {
        console.log('Attempting to restart bot due to conflict...');
        setTimeout(() => {
          initializeBot();
        }, 5000);
      }
    });

    console.log('Telegram bot initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
  }
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
