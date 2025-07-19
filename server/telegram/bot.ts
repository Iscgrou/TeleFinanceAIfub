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
    bot = new TelegramBot(botToken, { polling: true });
    
    bot.on('message', handleMessage);
    bot.on('callback_query', handleCallbackQuery);
    bot.on('document', handleDocument);
    
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error);
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
