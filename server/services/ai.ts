import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '../storage';

interface AICommand {
  intent: string;
  entities: Record<string, any>;
}

export async function processNaturalLanguageCommand(text: string): Promise<string> {
  try {
    const settings = await storage.getSystemSettings();
    if (!settings?.geminiApiKey) {
      return '❌ API Key جمینی تنظیم نشده است. لطفا از بخش تنظیمات آن را وارد کنید.';
    }

    const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
کاربر گفت: "${text}"

این درخواست را به یک دستور JSON تبدیل کن که شامل:
- intent: نوع درخواست (query_debt, register_payment, create_manual_invoice, get_rep_history, etc.)
- entities: اطلاعات استخراج شده از متن

فقط JSON را برگردان:
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      const command: AICommand = JSON.parse(response);
      return await executeCommand(command);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return await handleFallbackResponse(text);
    }
  } catch (error) {
    console.error('Error processing AI command:', error);
    return '❌ خطا در پردازش درخواست. لطفا دوباره تلاش کنید.';
  }
}

async function executeCommand(command: AICommand): Promise<string> {
  const { intent, entities } = command;

  switch (intent) {
    case 'query_debt':
      return await queryDebt(entities.representative_name);
      
    case 'register_payment':
      return await registerPayment(entities.representative_name, entities.amount);
      
    case 'create_manual_invoice':
      return await createManualInvoice(entities.representative_name, entities.amount);
      
    case 'get_rep_history':
      return await getRepresentativeHistory(entities.representative_name);
      
    case 'get_colleague_commission':
      return await getColleagueCommission(entities.colleague_name);
      
    default:
      return '❌ متوجه درخواست شما نشدم. لطفا روشن‌تر بیان کنید.';
  }
}

async function queryDebt(representativeName: string): Promise<string> {
  try {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return `❌ نماینده با نام "${representativeName}" یافت نشد.`;
    }

    const debt = rep.totalDebt || '0';
    return `💰 بدهی ${representativeName}: ${formatCurrency(debt)} تومان`;
  } catch (error) {
    return '❌ خطا در دریافت اطلاعات بدهی.';
  }
}

async function registerPayment(representativeName: string, amount: number): Promise<string> {
  try {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return `❌ نماینده با نام "${representativeName}" یافت نشد.`;
    }

    await storage.createPayment({
      representativeId: rep.id,
      amount: amount.toString()
    });

    // Update representative's total debt
    const newDebt = parseFloat(rep.totalDebt || '0') - amount;
    await storage.updateRepresentativeDebt(rep.id, newDebt.toString());

    return `✅ پرداخت ${formatCurrency(amount.toString())} تومانی برای ${representativeName} ثبت شد.
بدهی جدید: ${formatCurrency(newDebt.toString())} تومان`;
  } catch (error) {
    return '❌ خطا در ثبت پرداخت.';
  }
}

async function createManualInvoice(representativeName: string, amount: number): Promise<string> {
  try {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return `❌ نماینده با نام "${representativeName}" یافت نشد.`;
    }

    const invoice = await storage.createInvoice({
      representativeId: rep.id,
      amount: amount.toString(),
      status: 'unpaid',
      isManual: true
    });

    // Update representative's total debt
    const newDebt = parseFloat(rep.totalDebt || '0') + amount;
    await storage.updateRepresentativeDebt(rep.id, newDebt.toString());

    return `✅ فاکتور دستی برای ${representativeName} به مبلغ ${formatCurrency(amount.toString())} تومان با موفقیت صادر شد.
📄 شماره فاکتور: INV-${invoice.id}
💰 بدهی جدید: ${formatCurrency(newDebt.toString())} تومان`;
  } catch (error) {
    return '❌ خطا در صدور فاکتور.';
  }
}

async function getRepresentativeHistory(representativeName: string): Promise<string> {
  try {
    const rep = await storage.getRepresentativeByStoreName(representativeName);
    if (!rep) {
      return `❌ نماینده با نام "${representativeName}" یافت نشد.`;
    }

    const invoices = await storage.getInvoicesByRepresentative(rep.id);
    const payments = await storage.getPaymentsByRepresentative(rep.id);

    let response = `📊 گزارش مالی ${representativeName}:\n\n`;
    response += `💰 بدهی کل: ${formatCurrency(rep.totalDebt || '0')} تومان\n`;
    response += `📄 تعداد فاکتورها: ${invoices.length}\n`;
    response += `💳 تعداد پرداخت‌ها: ${payments.length}\n\n`;

    if (invoices.length > 0) {
      response += `آخرین فاکتورها:\n`;
      invoices.slice(0, 3).forEach(invoice => {
        response += `• ${formatCurrency(invoice.amount)} تومان - ${invoice.status === 'paid' ? '✅ پرداخت شده' : '❌ پرداخت نشده'}\n`;
      });
    }

    return response;
  } catch (error) {
    return '❌ خطا در دریافت تاریخچه.';
  }
}

async function getColleagueCommission(colleagueName: string): Promise<string> {
  try {
    const colleague = await storage.getSalesColleagueByName(colleagueName);
    if (!colleague) {
      return `❌ همکار با نام "${colleagueName}" یافت نشد.`;
    }

    const commissions = await storage.getCommissionsByColleague(colleague.id);
    const totalPending = commissions
      .filter(c => c.payoutStatus === 'pending')
      .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

    return `💼 اطلاعات پورسانت ${colleagueName}:
📊 نرخ کمیسیون: ${(parseFloat(colleague.commissionRate) * 100).toFixed(1)}%
💰 پورسانت معلق: ${formatCurrency(totalPending.toString())} تومان
📈 تعداد کل کمیسیون‌ها: ${commissions.length}`;
  } catch (error) {
    return '❌ خطا در دریافت اطلاعات پورسانت.';
  }
}

async function handleFallbackResponse(text: string): Promise<string> {
  return `🤔 متوجه درخواست "${text}" نشدم. 

می‌توانید از عبارات زیر استفاده کنید:
• "بدهی نماینده X چقدره؟"
• "پرداخت Y تومانی برای نماینده X ثبت کن"
• "فاکتور دستی Z تومانی برای X صادر کن"
• "سابقه مالی نماینده X رو بده"`;
}

function formatCurrency(amount: string): string {
  return parseFloat(amount).toLocaleString('fa-IR');
}
