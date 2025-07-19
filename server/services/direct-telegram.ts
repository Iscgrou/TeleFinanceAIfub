// Direct Telegram API service that bypasses bot polling conflicts
import { storage } from '../storage';

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
}

// Send message directly via Telegram API without using the bot instance
export async function sendDirectMessage(
  chatId: string, 
  text: string, 
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('Telegram bot token not configured');
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Direct Telegram send error:', error);
    return {
      ok: false,
      error_code: 500,
      description: error.message
    };
  }
}

// Send formatted invoice as text message
export async function sendInvoiceMessage(chatId: string, invoiceId: number): Promise<TelegramResponse> {
  try {
    // Get invoice details
    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const representative = await storage.getRepresentativeById(invoice.representativeId);
    if (!representative) {
      throw new Error('Representative not found');
    }
    
    // Format invoice as text with emojis and Persian text
    const portalUrl = `${process.env.REPL_URL || 'https://tele-finance-ai-iscdevtech.replit.app'}/representatives/portal/${representative.panelUsername}`;
    
    const invoiceText = `
📋 <b>فاکتور شماره ${invoiceId}</b>

🏪 نماینده: ${representative.storeName}
👤 صاحب فروشگاه: ${representative.ownerName || 'null'}
📱 شناسه پنل: ${representative.panelUsername}

💰 مبلغ فاکتور: <b>${parseFloat(invoice.amount).toLocaleString('fa-IR')} تومان</b>
📅 تاریخ صدور: ${new Date(invoice.issueDate).toLocaleDateString('fa-IR')}
🔍 وضعیت: <b>${invoice.status === 'unpaid' ? 'پرداخت نشده ❌' : 
                  invoice.status === 'paid' ? 'پرداخت شده ✅' : 'پرداخت جزئی 🔄'}</b>

ℹ️ برای مشاهده جزئیات کامل فاکتور، وارد لینک زیر بشوید

${portalUrl}

<i>تولید شده توسط سیستم مدیریت مالی 🤖</i>
    `.trim();
    
    return await sendDirectMessage(chatId, invoiceText, 'HTML');
  } catch (error) {
    console.error('Error sending invoice message:', error);
    return {
      ok: false,
      error_code: 500,
      description: error.message
    };
  }
}

// Check if bot token is working
export async function checkBotStatus(): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return {
      ok: false,
      error_code: 401,
      description: 'Bot token not configured'
    };
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    return await response.json();
  } catch (error) {
    return {
      ok: false,
      error_code: 500,
      description: error.message
    };
  }
}