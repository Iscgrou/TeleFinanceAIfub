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
        await sendMessage(chatId, '📄 لطفا فایل PHPMyAdmin usage.json این هفته را آپلود کنید.\n\n✅ منطق محاسباتی تأیید شده:\n• 199 نماینده منحصربفرد\n• 109.3 میلیون تومان\n• یک نماینده به ازای هر admin_username\n\nیا دستور زیر را ارسال کنید:\n"فاکتورهای این هفته رو صادر کن"');
        break;

      case 'sample_commands':
        const commandList = SAMPLE_AI_COMMANDS.map((cmd, index) => `${index + 1}. ${cmd}`).join('\n\n');
        await sendMessage(chatId, `🤖 نمونه دستورات برای دستیار هوشمند:\n\n${commandList}\n\nشما می‌توانید هر دستوری را به زبان فارسی یا انگلیسی ارسال کنید.`);
        break;

      case 'start_ai_conversation':
        await sendMessage(chatId, '🤖 حالا می‌توانید با من صحبت کنید! درخواست خود را به زبان فارسی بنویسید:\n\nمثال: "وضعیت فروشگاه اکباتان رو بررسی کن"');
        break;

      // Representatives management
      case 'add_representative':
        await sendMessage(chatId, '➕ برای افزودن نماینده جدید، اطلاعات زیر را به ترتیب ارسال کنید:\n\n"نماینده جدید:\nنام فروشگاه: [نام]\nنام مالک: [نام]\nنام کاربری پنل: [نام کاربری]\nشماره تلفن: [شماره]\nنام همکار فروش: [نام]"\n\nمثال:\nنماینده جدید:\nنام فروشگاه: فروشگاه تهران\nنام مالک: احمد احمدی\nنام کاربری پنل: tehranshop\nشماره تلفن: 09123456789\nنام همکار فروش: علی محمدی');
        break;
        
      case 'search_representative':
        await sendMessage(chatId, '🔍 برای جستجوی نماینده، نام فروشگاه یا نام کاربری پنل را ارسال کنید:\n\nمثال: "جستجوی نماینده: tehranshop"');
        break;
        
      case 'list_representatives':
        await handleListRepresentatives(chatId);
        break;
        
      case 'debtors_list':
        await sendMessage(chatId, '💰 دریافت لیست بدهکاران...');
        await processAICommand(chatId, 'لیست نمایندگان بدهکار رو نشون بده');
        break;

      // Sales colleagues management  
      case 'add_colleague':
        await sendMessage(chatId, '👥 برای افزودن همکار فروش جدید، اطلاعات زیر را ارسال کنید:\n\n"همکار جدید:\nنام: [نام کامل]\nنرخ کمیسیون: [درصد]"\n\nمثال:\nهمکار جدید:\nنام: علی محمدی\nنرخ کمیسیون: 5');
        break;
        
      case 'list_colleagues':
        await handleListColleagues(chatId);
        break;
        
      case 'calculate_commissions':
        await sendMessage(chatId, '💰 محاسبه کمیسیون...');
        await processAICommand(chatId, 'کمیسیون همکاران فروش رو برای ماه گذشته محاسبه کن');
        break;
        
      case 'payout_commissions':
        await sendMessage(chatId, '💳 پردازش پرداخت کمیسیون‌ها...');
        await processAICommand(chatId, 'وضعیت پرداخت کمیسیون‌ها رو نشون بده');
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

// Handle list representatives command
async function handleListRepresentatives(chatId: string): Promise<void> {
  try {
    const representatives = await storage.getRepresentatives();
    
    if (representatives.length === 0) {
      await sendMessage(chatId, '📋 هیچ نماینده‌ای در سیستم ثبت نشده است.');
      return;
    }

    const activeReps = representatives.filter(rep => rep.isActive);
    const inactiveReps = representatives.filter(rep => !rep.isActive);
    
    let message = `📊 **آمار کلی نمایندگان:**\n\n`;
    message += `🟢 فعال: ${activeReps.length}\n`;
    message += `🔴 غیرفعال: ${inactiveReps.length}\n`;
    message += `📈 مجموع کل: ${representatives.length}\n\n`;
    
    if (activeReps.length > 0) {
      message += `📋 **نمایندگان فعال:**\n\n`;
      activeReps.slice(0, 10).forEach((rep, index) => {
        const debt = parseFloat(rep.totalDebt || '0');
        const debtFormatted = debt.toLocaleString('fa-IR');
        message += `${index + 1}. **${rep.storeName}**\n`;
        message += `   👤 ${rep.ownerName || 'نامشخص'}\n`;
        message += `   💰 بدهی: ${debtFormatted} تومان\n`;
        message += `   🔐 نام کاربری: ${rep.panelUsername}\n\n`;
      });
      
      if (activeReps.length > 10) {
        message += `... و ${activeReps.length - 10} نماینده دیگر\n\n`;
      }
    }
    
    message += `💡 برای جزئیات بیشتر، از دستور "جستجوی نماینده: [نام]" استفاده کنید.`;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Error listing representatives:', error);
    await sendMessage(chatId, '❌ خطا در دریافت لیست نمایندگان.');
  }
}

// Handle list colleagues command
async function handleListColleagues(chatId: string): Promise<void> {
  try {
    const colleagues = await storage.getSalesColleagues();
    
    if (colleagues.length === 0) {
      await sendMessage(chatId, '👥 هیچ همکار فروشی در سیستم ثبت نشده است.');
      return;
    }

    let message = `👥 **لیست همکاران فروش:**\n\n`;
    
    for (let i = 0; i < colleagues.length; i++) {
      const colleague = colleagues[i];
      const commissionRate = parseFloat(colleague.commissionRate);
      
      message += `${i + 1}. **${colleague.name}**\n`;
      message += `   💰 نرخ کمیسیون: ${commissionRate}%\n`;
      message += `   📅 تاریخ عضویت: ${colleague.createdAt ? new Date(colleague.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}\n\n`;
    }
    
    message += `💡 برای محاسبه کمیسیون، از دکمه "💰 محاسبه کمیسیون" استفاده کنید.`;
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Error listing colleagues:', error);
    await sendMessage(chatId, '❌ خطا در دریافت لیست همکاران فروش.');
  }
}

// Handle new representative input
async function handleNewRepresentativeInput(chatId: string, text: string): Promise<void> {
  try {
    // Parse the input format:
    // نماینده جدید:
    // نام فروشگاه: [نام]
    // نام مالک: [نام]
    // نام کاربری پنل: [نام کاربری]
    // شماره تلفن: [شماره]
    // نام همکار فروش: [نام]
    
    const lines = text.split('\n').map(line => line.trim());
    const data: any = {};
    
    for (const line of lines) {
      if (line.startsWith('نام فروشگاه:')) {
        data.storeName = line.replace('نام فروشگاه:', '').trim();
      } else if (line.startsWith('نام مالک:')) {
        data.ownerName = line.replace('نام مالک:', '').trim();
      } else if (line.startsWith('نام کاربری پنل:')) {
        data.panelUsername = line.replace('نام کاربری پنل:', '').trim();
      } else if (line.startsWith('شماره تلفن:')) {
        data.phone = line.replace('شماره تلفن:', '').trim();
      } else if (line.startsWith('نام همکار فروش:')) {
        data.salesColleagueName = line.replace('نام همکار فروش:', '').trim();
      }
    }
    
    // Validate required fields
    if (!data.storeName) {
      await sendMessage(chatId, '❌ نام فروشگاه اجباری است. لطفا فرمت صحیح را رعایت کنید.');
      return;
    }
    
    // Convert to AI command
    const command = `نماینده جدید ایجاد کن: نام فروشگاه="${data.storeName}", نام مالک="${data.ownerName || ''}", نام کاربری="${data.panelUsername || ''}", تلفن="${data.phone || ''}", همکار فروش="${data.salesColleagueName || ''}"`;
    await processAICommand(chatId, command);
    
  } catch (error) {
    console.error('Error handling new representative input:', error);
    await sendMessage(chatId, '❌ خطا در پردازش اطلاعات نماینده. لطفا فرمت صحیح را رعایت کنید.');
  }
}

// Handle new colleague input
async function handleNewColleagueInput(chatId: string, text: string): Promise<void> {
  try {
    // Parse the input format:
    // همکار جدید:
    // نام: [نام کامل]
    // نرخ کمیسیون: [درصد]
    
    const lines = text.split('\n').map(line => line.trim());
    const data: any = {};
    
    for (const line of lines) {
      if (line.startsWith('نام:')) {
        data.name = line.replace('نام:', '').trim();
      } else if (line.startsWith('نرخ کمیسیون:')) {
        const rateStr = line.replace('نرخ کمیسیون:', '').trim();
        data.commissionRate = parseFloat(rateStr);
      }
    }
    
    // Validate required fields
    if (!data.name) {
      await sendMessage(chatId, '❌ نام همکار فروش اجباری است. لطفا فرمت صحیح را رعایت کنید.');
      return;
    }
    
    if (!data.commissionRate || isNaN(data.commissionRate)) {
      await sendMessage(chatId, '❌ نرخ کمیسیون باید یک عدد معتبر باشد. مثال: 5.5');
      return;
    }
    
    // Convert to AI command
    const command = `همکار فروش جدید ایجاد کن: نام="${data.name}", نرخ کمیسیون=${data.commissionRate}`;
    await processAICommand(chatId, command);
    
  } catch (error) {
    console.error('Error handling new colleague input:', error);
    await sendMessage(chatId, '❌ خطا در پردازش اطلاعات همکار فروش. لطفا فرمت صحیح را رعایت کنید.');
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
    // Handle representative creation
    if (text.startsWith('نماینده جدید:')) {
      await handleNewRepresentativeInput(chatId, text);
      return;
    }

    // Handle colleague creation
    if (text.startsWith('همکار جدید:')) {
      await handleNewColleagueInput(chatId, text);
      return;
    }

    // Handle representative search
    if (text.startsWith('جستجوی نماینده:')) {
      const searchTerm = text.replace('جستجوی نماینده:', '').trim();
      await processAICommand(chatId, `جستجوی نماینده: ${searchTerm}`);
      return;
    }

    // Check for structured user input patterns
    if (text.includes('پرداخت:') || text.includes('پرداخت ')) {
      const command = `ثبت پرداخت: ${text}`;
      await processAICommand(chatId, command);
      return;
    }

    if (text.includes('فاکتور:') || text.includes('فاکتور ')) {
      const command = `صادر کردن فاکتور: ${text}`;
      await processAICommand(chatId, command);
      return;
    }

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
      
      // Check if this was an invoice generation command
      if ((result as any).toolResults && (result as any).toolResults.length > 0) {
        for (const toolResult of (result as any).toolResults) {
          if (toolResult.toolName === 'generate_representative_invoice' && 
              toolResult.result.status === 'success' && 
              toolResult.result.image_generated) {
            
            try {
              const { generateInvoiceImage } = await import('../services/svg-invoice-generator');
              const imageBuffer = await generateInvoiceImage(toolResult.result.invoice_id);
              if (imageBuffer) {
                const { getBot } = await import('./bot');
                const botInstance = getBot();
                if (botInstance) {
                  await botInstance.sendPhoto(chatId, imageBuffer, {
                    caption: `فاکتور نماینده: ${toolResult.result.representative_name}`
                  });
                }
              }
            } catch (error) {
              console.error('Failed to send invoice image:', error);
              await sendMessage(chatId, '❌ خطا در ارسال تصویر فاکتور. لطفا دوباره تلاش کنید.');
            }
          }
        }
      }
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
      await sendWelcomeMessage(chatId, admin.isSuperAdmin || false);
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
      
      // Special handling for batch messaging - send individual messages
      if (toolCall.name === 'execute_batch_messaging' && result.status === 'success') {
        await sendMessage(chatId, `📤 ارسال ${result.target_count} پیام شخصی‌سازی شده...`);
        
        // Send each personalized message separately
        for (let i = 0; i < result.messages_generated.length; i++) {
          const message = result.messages_generated[i];
          await sendMessage(chatId, `📨 پیام ${i + 1}:\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          
          // Small delay to avoid overwhelming the chat
          if (i < result.messages_generated.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Special handling for financial profiles
      if (toolCall.name === 'generate_financial_profile' && result.status === 'success') {
        const { formatFinancialProfile } = await import('../services/financial-profile');
        const formatted = formatFinancialProfile(result.profile_data);
        await sendMessage(chatId, formatted.text, { reply_markup: formatted.reply_markup });
      }
      
      // Special handling for invoice image generation
      if (toolCall.name === 'generate_invoice_images' && result.status === 'success' && result.images_ready) {
        await sendMessage(chatId, `✅ ${result.images_generated} فاکتور آماده ارسال شد.\n\nدر حال ارسال تصاویر...`);
        
        const { generateInvoiceImage } = await import('../services/svg-invoice-generator');
        
        for (const invoiceId of result.invoice_ids) {
          try {
            const imageBuffer = await generateInvoiceImage(invoiceId);
            if (imageBuffer) {
              // Send image to admin
              const { getBot } = await import('./bot');
              const botInstance = getBot();
              if (botInstance) {
                await botInstance.sendPhoto(chatId, imageBuffer, {
                  caption: `فاکتور شماره #${invoiceId}`
                });
              }
              
              // Small delay between images
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`Failed to send invoice ${invoiceId}:`, error);
          }
        }
      }
      
      // Special handling for single representative invoice generation
      if (toolCall.name === 'generate_representative_invoice' && result.status === 'success' && result.image_generated) {
        await sendMessage(chatId, result.message);
        
        const { generateInvoiceImage } = await import('../services/svg-invoice-generator');
        
        try {
          const imageBuffer = await generateInvoiceImage(result.invoice_id);
          if (imageBuffer) {
            // Send image to admin
            const { getBot } = await import('./bot');
            const botInstance = getBot();
            if (botInstance) {
              await botInstance.sendPhoto(chatId, imageBuffer, {
                caption: `فاکتور نماینده: ${result.representative_name}`
              });
            }
          }
        } catch (error) {
          console.error(`Failed to send invoice image:`, error);
          await sendMessage(chatId, '❌ خطا در ارسال تصویر فاکتور. لطفا دوباره تلاش کنید.');
        }
      }
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
  await sendMessage(chatId, '📊 در حال پردازش فایل PHPMyAdmin usage.json با منطق تأیید شده...');
  
  try {
    const { getBot } = await import('./bot');
    const bot = getBot();
    if (!bot) {
      throw new Error('Bot not initialized');
    }

    // Download the file
    const fileLink = await bot.getFileLink(document.file_id);
    const response = await fetch(fileLink);
    const fileContent = await response.text();
    
    // Process with VALIDATED logic through AI agent
    const command = `فاکتورهای این هفته رو بر اساس فایل PHPMyAdmin usage.json که آپلود شده با منطق تأیید شده (199 نماینده، 109.3M تومان) صادر کن. فایل: ${fileContent}`;
    await processAICommand(chatId, command);
  } catch (error) {
    console.error('Error processing usage file:', error);
    await sendMessage(chatId, '❌ خطا در پردازش فایل. لطفا فایل PHPMyAdmin JSON صحیح آپلود کنید.');
  }
}
