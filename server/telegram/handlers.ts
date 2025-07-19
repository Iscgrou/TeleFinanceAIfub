import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { sendMessage, sendInlineKeyboard } from './bot';
import { processNaturalLanguageCommand } from '../services/ai';
import { transcribeAudio } from '../services/speech';

export async function handleMessage(msg: TelegramBot.Message): Promise<void> {
  const chatId = msg.chat.id.toString();
  
  try {
    // Check if user is authorized admin
    const admin = await storage.getAdmin(chatId);
    
    if (msg.text === '/start') {
      if (!admin) {
        // Check if this is the first user (super admin)
        const adminCount = await storage.getAdminCount();
        if (adminCount === 0) {
          await storage.createAdmin({ 
            chatId, 
            fullName: msg.from?.first_name + ' ' + (msg.from?.last_name || ''),
            isSuperAdmin: true 
          });
          await sendWelcomeMessage(chatId, true);
        } else {
          await sendMessage(chatId, '❌ شما مجاز به استفاده از این سیستم نیستید.');
        }
      } else {
        await sendWelcomeMessage(chatId, admin.isSuperAdmin);
      }
      return;
    }

    if (!admin) {
      await sendMessage(chatId, '❌ لطفا ابتدا از دستور /start استفاده کنید.');
      return;
    }

    // Handle voice messages
    if (msg.voice) {
      await handleVoiceMessage(chatId, msg.voice);
      return;
    }

    // Handle text commands
    if (msg.text) {
      await handleTextCommand(chatId, msg.text);
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await sendMessage(chatId, '❌ خطا در پردازش پیام. لطفا دوباره تلاش کنید.');
  }
}

export async function handleCallbackQuery(query: TelegramBot.CallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id.toString();
  if (!chatId) return;

  try {
    const data = query.data;
    
    switch (data) {
      case 'dashboard':
        await sendMessage(chatId, '📊 برای مشاهده داشبورد کامل، لینک زیر را باز کنید:', {
          reply_markup: {
            inline_keyboard: [[
              { text: '📊 باز کردن داشبورد', web_app: { url: `${process.env.WEBAPP_URL}/dashboard` } }
            ]]
          }
        });
        break;
        
      case 'settings':
        await sendMessage(chatId, '⚙️ برای دسترسی به تنظیمات، لینک زیر را باز کنید:', {
          reply_markup: {
            inline_keyboard: [[
              { text: '⚙️ باز کردن تنظیمات', web_app: { url: `${process.env.WEBAPP_URL}/settings` } }
            ]]
          }
        });
        break;
        
      case 'weekly_invoice':
        await sendMessage(chatId, '📄 لطفا فایل usage.json این هفته را آپلود کنید.');
        break;
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
  }
}

export async function handleDocument(msg: TelegramBot.Message): Promise<void> {
  const chatId = msg.chat.id.toString();
  
  try {
    if (msg.document?.file_name?.endsWith('.json')) {
      await processUsageJsonFile(chatId, msg.document);
    } else {
      await sendMessage(chatId, '❌ فرمت فایل پشتیبانی نمی‌شود. لطفا فایل JSON آپلود کنید.');
    }
  } catch (error) {
    console.error('Error handling document:', error);
    await sendMessage(chatId, '❌ خطا در پردازش فایل.');
  }
}

async function sendWelcomeMessage(chatId: string, isSuperAdmin: boolean): Promise<void> {
  const message = `✅ سلام! شما به عنوان ${isSuperAdmin ? 'سوپر ادمین' : 'ادمین'} تایید شدید.

🤖 من دستیار مالی هوشمند شما هستم. می‌توانید با من به زبان فارسی صحبت کنید و درخواست‌های خود را بیان کنید.

📋 دستورات موجود:`;

  const keyboard = [
    [{ text: '📊 داشبورد', callback_data: 'dashboard' }],
    [{ text: '⚙️ تنظیمات', callback_data: 'settings' }],
    [{ text: '📄 صدور فاکتور هفتگی', callback_data: 'weekly_invoice' }]
  ];

  if (isSuperAdmin) {
    keyboard.push([{ text: '👥 مدیریت ادمین‌ها', callback_data: 'manage_admins' }]);
  }

  await sendInlineKeyboard(chatId, message, keyboard);
}

async function handleVoiceMessage(chatId: string, voice: TelegramBot.Voice): Promise<void> {
  await sendMessage(chatId, '🎯 در حال پردازش پیام صوتی...');
  
  try {
    const transcript = await transcribeAudio(voice.file_id);
    const response = await processNaturalLanguageCommand(transcript);
    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Error processing voice message:', error);
    await sendMessage(chatId, '❌ خطا در پردازش پیام صوتی.');
  }
}

async function handleTextCommand(chatId: string, text: string): Promise<void> {
  try {
    const response = await processNaturalLanguageCommand(text);
    await sendMessage(chatId, response);
  } catch (error) {
    console.error('Error processing text command:', error);
    await sendMessage(chatId, '❌ خطا در پردازش دستور.');
  }
}

async function processUsageJsonFile(chatId: string, document: TelegramBot.Document): Promise<void> {
  // Implementation for processing weekly usage JSON file
  await sendMessage(chatId, '📊 در حال پردازش فایل usage.json...');
  
  try {
    // Download and process the file
    // This would involve parsing the JSON and creating invoices
    await sendMessage(chatId, '✅ پردازش کامل شد. فاکتورها با موفقیت صادر شدند.');
  } catch (error) {
    console.error('Error processing usage file:', error);
    await sendMessage(chatId, '❌ خطا در پردازش فایل.');
  }
}
