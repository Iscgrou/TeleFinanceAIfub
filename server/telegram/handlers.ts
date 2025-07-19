import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { sendMessage, sendInlineKeyboard } from './bot';
import { processNaturalLanguageCommand } from '../services/ai';
import { financialAgent } from '../services/agent';
import { speechService } from '../services/speech';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { sendMainMenu, sendSubmenu, getRepresentativeActionButtons, SAMPLE_AI_COMMANDS } from './menus';
import { 
  createPendingAction, 
  getPendingAction, 
  removePendingAction,
  formatConfirmationMessage,
  generateActionDescription,
  isDestructiveAction 
} from '../services/confirmations';

export async function handleMessage(msg: TelegramBot.Message): Promise<void> {
  const chatId = msg.chat.id.toString();
  
  try {
    // Handle /start command without authorization (only command allowed for non-admins)
    if (msg.text === '/start') {
      await handleStartCommand(chatId, msg);
      return;
    }

    // All other commands require admin authorization
    const isAuthorized = await requireAdmin(chatId);
    if (!isAuthorized) {
      return; // Access denied message already sent by middleware
    }

    // Handle admin management commands (super admin only)
    if (msg.text?.startsWith('/add_admin')) {
      const isSuperAdmin = await requireSuperAdmin(chatId);
      if (isSuperAdmin) {
        await handleAddAdminCommand(chatId, msg.text);
      }
      return;
    }

    // Handle menu commands
    if (msg.text === '/menu') {
      await sendMainMenu(chatId);
      return;
    }

    // Handle voice messages
    if (msg.voice) {
      await handleVoiceMessage(chatId, msg.voice);
      return;
    }

    // Handle document uploads
    if (msg.document) {
      await handleDocument(msg);
      return;
    }

    // Handle text commands (AI processing)
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
    // Authorization required for all callback queries
    const isAuthorized = await requireAdmin(chatId);
    if (!isAuthorized) {
      return;
    }

    const data = query.data!;
    
    // Handle confirmation actions
    if (data.startsWith('confirm_action:')) {
      await handleActionConfirmation(chatId, data);
      return;
    }
    
    if (data.startsWith('cancel_action:')) {
      await handleActionCancellation(chatId, data);
      return;
    }

    // Handle menu navigation
    if (data.startsWith('menu_') || data === 'main_menu') {
      await sendSubmenu(chatId, data);
      return;
    }

    // Handle specific actions
    switch (data) {
      case 'dashboard':
        await sendMessage(chatId, '📊 برای مشاهده داشبورد کامل، لینک زیر را در مرورگر باز کنید:\n\nhttps://' + (process.env.REPL_ID || 'your-repl') + '.' + (process.env.REPL_OWNER || 'username') + '.replit.app/dashboard');
        break;
        
      case 'settings':
      case 'api_settings':
        await sendMessage(chatId, '⚙️ برای دسترسی به تنظیمات، لینک زیر را در مرورگر باز کنید:\n\nhttps://' + (process.env.REPL_ID || 'your-repl') + '.' + (process.env.REPL_OWNER || 'username') + '.replit.app/settings');
        break;
        
      case 'weekly_invoice':
      case 'weekly_invoices':
        await sendMessage(chatId, '📄 لطفا فایل usage.json این هفته را آپلود کنید یا دستور زیر را ارسال کنید:\n\n"فاکتورهای این هفته رو صادر کن"');
        break;

      case 'sample_commands':
        const commandList = SAMPLE_AI_COMMANDS.map((cmd, index) => `${index + 1}. ${cmd}`).join('\n\n');
        await sendMessage(chatId, `🤖 نمونه دستورات برای دستیار هوشمند:\n\n${commandList}\n\nشما می‌توانید هر دستوری را به زبان فارسی یا انگلیسی ارسال کنید.`);
        break;

      case 'start_ai_conversation':
        await sendMessage(chatId, '🤖 حالا می‌توانید با من صحبت کنید! درخواست خود را به زبان فارسی بنویسید:\n\nمثال: "وضعیت فروشگاه اکباتان رو بررسی کن"');
        break;

      default:
        // Handle other callback queries through AI agent
        await handleCallbackAsCommand(chatId, data);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await sendMessage(chatId, '❌ خطا در پردازش درخواست.');
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
  const message = `✅ خوش آمدید! شما به عنوان ${isSuperAdmin ? 'سوپر ادمین' : 'ادمین'} تایید شدید.

🤖 من دستیار مالی هوشمند پیشرفته شما هستم. قابلیت‌های من:

🧠 **پردازش دستورات پیچیده**: می‌توانم عملیات چندمرحله‌ای انجام دهم
💬 **گفتگوی طبیعی**: با من به زبان فارسی صحبت کنید
🔐 **تایید انسانی**: عملیات مهم نیاز به تایید شما دارد
📱 **رابط ترکیبی**: هم منو و هم گفتگو

📋 برای شروع دستور /menu را ارسال کنید یا مستقیماً درخواست خود را بنویسید.

---

✅ Welcome! You are confirmed as ${isSuperAdmin ? 'Super Admin' : 'Admin'}.

🤖 I am your advanced intelligent financial assistant.

Send /menu for structured interface or chat directly in Persian/English.`;

  const keyboard = [
    [
      { text: '📋 منوی اصلی', callback_data: 'main_menu' },
      { text: '🤖 شروع گفتگو', callback_data: 'start_ai_conversation' }
    ],
    [
      { text: '📊 داشبورد', callback_data: 'dashboard' },
      { text: '⚙️ تنظیمات', callback_data: 'settings' }
    ]
  ];

  if (isSuperAdmin) {
    keyboard.push([{ text: '👥 مدیریت ادمین‌ها', callback_data: 'manage_admins' }]);
  }

  await sendInlineKeyboard(chatId, message, keyboard);
}

async function handleVoiceMessage(chatId: string, voice: TelegramBot.Voice): Promise<void> {
  await sendMessage(chatId, '🎯 در حال پردازش پیام صوتی...');
  
  try {
    // Download the voice file first
    // For now, we'll inform the user about voice capability
    await sendMessage(chatId, '🎙️ قابلیت پردازش پیام صوتی به‌زودی فعال خواهد شد. لطفا دستور خود را به صورت متن بفرستید.');
  } catch (error) {
    console.error('Error processing voice message:', error);
    await sendMessage(chatId, '❌ خطا در پردازش پیام صوتی.');
  }
}

async function handleTextCommand(chatId: string, text: string): Promise<void> {
  await sendMessage(chatId, '🤖 در حال تحلیل دستور شما...');
  
  try {
    // Process command through AI agent with enhanced confirmation flow
    await processAICommand(chatId, text);
  } catch (error) {
    console.error('Error processing command:', error);
    await sendMessage(chatId, '❌ خطا در پردازش دستور شما. لطفا دوباره تلاش کنید.');
  }
}

// Enhanced AI command processing with human-in-the-loop confirmation
async function processAICommand(chatId: string, command: string): Promise<void> {
  try {
    // Use enhanced AI agent that implements Plan -> Propose -> Confirm -> Act
    const result = await financialAgent.processCommandWithConfirmation(command, chatId);
    
    if (result.requiresConfirmation) {
      // Destructive actions require human confirmation
      const actionId = createPendingAction(
        chatId, 
        result.actionDescription!, 
        result.plannedActions!
      );
      
      const confirmationMessage = formatConfirmationMessage(result.actionDescription!, actionId);
      await sendMessage(chatId, confirmationMessage.text, { reply_markup: confirmationMessage.reply_markup });
    } else {
      // Non-destructive actions can execute immediately
      await sendMessage(chatId, result.response);
    }
  } catch (error) {
    console.error('Error processing AI command:', error);
    await sendMessage(chatId, '❌ خطا در پردازش دستور هوشمند.');
  }
}

// Handle start command and admin registration
async function handleStartCommand(chatId: string, msg: TelegramBot.Message): Promise<void> {
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
        await sendMessage(chatId, '🚫 دسترسی مجاز نیست\n\nشما مجاز به استفاده از این سیستم نیستید. لطفا با مدیر سیستم تماس بگیرید.\n\nAccess Denied: You are not authorized to use this system.');
      }
    } else {
      await sendWelcomeMessage(chatId, admin.isSuperAdmin);
    }
  }
}

// Handle add admin command (super admin only)
async function handleAddAdminCommand(chatId: string, command: string): Promise<void> {
  const parts = command.split(' ');
  if (parts.length < 2) {
    await sendMessage(chatId, '❌ فرمت نادرست. استفاده صحیح:\n/add_admin <chat_id>\n\nمثال: /add_admin 123456789');
    return;
  }

  const newAdminChatId = parts[1];
  
  try {
    const existingAdmin = await storage.getAdmin(newAdminChatId);
    if (existingAdmin) {
      await sendMessage(chatId, '⚠️ این کاربر قبلاً به عنوان ادمین ثبت شده است.');
      return;
    }

    await storage.createAdmin({
      chatId: newAdminChatId,
      fullName: 'New Admin',
      isSuperAdmin: false
    });

    await sendMessage(chatId, `✅ ادمین جدید با موفقیت اضافه شد.\nChat ID: ${newAdminChatId}`);
    
    // Notify the new admin
    try {
      await sendMessage(newAdminChatId, '🎉 شما به عنوان ادمین سیستم مدیریت مالی اضافه شدید!\n\nبرای شروع، دستور /start را ارسال کنید.');
    } catch (error) {
      console.log('Could not notify new admin (they need to start the bot first)');
    }
    
  } catch (error) {
    console.error('Error adding admin:', error);
    await sendMessage(chatId, '❌ خطا در افزودن ادمین جدید.');
  }
}

// Handle action confirmation
async function handleActionConfirmation(chatId: string, callbackData: string): Promise<void> {
  const actionId = callbackData.split(':')[1];
  const pendingAction = getPendingAction(actionId);
  
  if (!pendingAction) {
    await sendMessage(chatId, '❌ عملیات منقضی شده یا یافت نشد.');
    return;
  }

  if (pendingAction.chatId !== chatId) {
    await sendMessage(chatId, '❌ شما مجاز به تایید این عملیات نیستید.');
    return;
  }

  try {
    await sendMessage(chatId, '⚡ در حال اجرای عملیات تایید شده...');
    
    // Execute the confirmed actions
    const results = [];
    for (const toolCall of pendingAction.toolCalls) {
      const result = await financialAgent.executeToolDirectly(toolCall.name, toolCall.args);
      results.push(result);
    }
    
    removePendingAction(actionId);
    
    const summary = financialAgent.generateExecutionSummary(pendingAction.toolCalls, results);
    await sendMessage(chatId, `✅ عملیات با موفقیت انجام شد!\n\n${summary}`);
    
  } catch (error) {
    console.error('Error executing confirmed action:', error);
    removePendingAction(actionId);
    await sendMessage(chatId, '❌ خطا در اجرای عملیات. لطفا دوباره تلاش کنید.');
  }
}

// Handle action cancellation
async function handleActionCancellation(chatId: string, callbackData: string): Promise<void> {
  const actionId = callbackData.split(':')[1];
  const pendingAction = getPendingAction(actionId);
  
  if (!pendingAction) {
    await sendMessage(chatId, '❌ عملیات منقضی شده یا یافت نشد.');
    return;
  }

  if (pendingAction.chatId !== chatId) {
    await sendMessage(chatId, '❌ شما مجاز به لغو این عملیات نیستید.');
    return;
  }

  removePendingAction(actionId);
  await sendMessage(chatId, '❌ عملیات لغو شد.\n\nOperation cancelled.');
}

// Handle callback queries as AI commands
async function handleCallbackAsCommand(chatId: string, callbackData: string): Promise<void> {
  // Map callback data to natural language commands
  const commandMappings: Record<string, string> = {
    'list_representatives': 'لیست تمام نمایندگان رو نشون بده',
    'debtors_list': 'لیست نمایندگان بدهکار رو نشون بده',
    'list_colleagues': 'لیست همکاران فروش رو نشون بده',
    'calculate_commissions': 'کمیسیون همکاران فروش رو محاسبه کن',
    'register_payment': 'راهنمای ثبت پرداخت رو بده',
    'create_invoice': 'راهنمای ایجاد فاکتور رو بده',
    'payment_history': 'تاریخچه پرداخت‌ها رو نشون بده',
    'financial_summary': 'خلاصه مالی رو بده',
    'dashboard_stats': 'آمار داشبورد رو نشون بده',
    'debt_report': 'گزارش بدهی‌ها رو بده',
    'commission_report': 'گزارش کمیسیون‌ها رو بده'
  };

  const command = commandMappings[callbackData] || `اجرای عملیات: ${callbackData}`;
  await processAICommand(chatId, command);
}

async function processUsageJsonFile(chatId: string, document: TelegramBot.Document): Promise<void> {
  await sendMessage(chatId, '📊 در حال پردازش فایل usage.json...');
  
  try {
    // Process JSON file through AI agent with confirmation
    const command = `فاکتورهای این هفته رو بر اساس فایل مصرفی که آپلود شده صادر کن`;
    await processAICommand(chatId, command);
  } catch (error) {
    console.error('Error processing usage file:', error);
    await sendMessage(chatId, '❌ خطا در پردازش فایل.');
  }
}
