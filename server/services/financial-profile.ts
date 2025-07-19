import { storage } from '../storage';
import { Representative, Invoice, Payment } from '@shared/schema';

// Interface for comprehensive financial profile
export interface FinancialProfile {
  representative: Representative;
  totalDebt: number;
  lastInvoice?: Invoice;
  lastPayment?: Payment;
  recentInvoices: Invoice[];
  recentPayments: Payment[];
  summary: {
    unpaidInvoicesCount: number;
    totalUnpaidAmount: number;
    paymentHistory30Days: number;
    daysSinceLastPayment: number;
    averageMonthlyDebt: number;
  };
}

// Generate comprehensive financial profile for a representative
export async function generateFinancialProfile(representativeName: string): Promise<FinancialProfile | null> {
  try {
    // Find the representative
    const representative = await storage.getRepresentativeByStoreName(representativeName);
    if (!representative) {
      return null;
    }

    // Get all invoices and payments for this representative
    const allInvoices = await storage.getInvoicesByRepresentative(representative.id);
    const allPayments = await storage.getPaymentsByRepresentative(representative.id);

    // Calculate financial metrics
    const totalDebt = parseFloat(representative.totalDebt);
    
    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInvoices = allInvoices.filter(inv => 
      new Date(inv.issueDate) >= thirtyDaysAgo
    ).slice(0, 5);
    
    const recentPayments = allPayments.filter(pay => 
      new Date(pay.paymentDate) >= thirtyDaysAgo
    ).slice(0, 5);

    // Find last invoice and payment
    const lastInvoice = allInvoices[0]; // Already ordered by date desc
    const lastPayment = allPayments[0];

    // Calculate summary statistics
    const unpaidInvoices = allInvoices.filter(inv => inv.status !== 'paid');
    const unpaidInvoicesCount = unpaidInvoices.length;
    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    
    const paymentHistory30Days = recentPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    
    const daysSinceLastPayment = lastPayment 
      ? Math.floor((Date.now() - new Date(lastPayment.paymentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate average monthly debt (simplified)
    const averageMonthlyDebt = allInvoices.length > 0 
      ? allInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) / Math.max(allInvoices.length / 4, 1)
      : 0;

    return {
      representative,
      totalDebt,
      lastInvoice,
      lastPayment,
      recentInvoices,
      recentPayments,
      summary: {
        unpaidInvoicesCount,
        totalUnpaidAmount,
        paymentHistory30Days,
        daysSinceLastPayment,
        averageMonthlyDebt
      }
    };

  } catch (error) {
    console.error('Error generating financial profile:', error);
    return null;
  }
}

// Format financial profile as a rich Telegram message
export function formatFinancialProfile(profile: FinancialProfile): {
  text: string;
  reply_markup: any;
} {
  const { representative, totalDebt, lastInvoice, lastPayment, summary } = profile;
  
  // Format debt status with emoji
  let debtStatus = '🟢';
  let debtText = 'بدون بدهی';
  
  if (totalDebt > 0) {
    if (totalDebt > 5000000) {
      debtStatus = '🔴';
      debtText = `بدهکار (بالا)`;
    } else if (totalDebt > 1000000) {
      debtStatus = '🟡';
      debtText = `بدهکار (متوسط)`;
    } else {
      debtStatus = '🟠';
      debtText = `بدهکار (کم)`;
    }
  }

  // Format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR');
  };

  let text = `👤 **پروفایل مالی: ${representative.storeName}**

**اطلاعات پایه:**
• **همکار فروش معرف:** ${representative.salesColleagueName || 'نامشخص'}
• **یوزرنیم پنل:** \`${representative.panelUsername || 'نامشخص'}\`
• **آی‌دی تلگرام:** ${representative.telegramId || 'نامشخص'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

**وضعیت مالی فعلی:**
${debtStatus} **مانده حساب:** ${totalDebt.toLocaleString()} تومان (${debtText})

**آمار کلی:**
• **فاکتورهای پرداخت نشده:** ${summary.unpaidInvoicesCount} فاکتور
• **مبلغ کل پرداخت نشده:** ${summary.totalUnpaidAmount.toLocaleString()} تومان
• **پرداختی ۳۰ روز گذشته:** ${summary.paymentHistory30Days.toLocaleString()} تومان

━━━━━━━━━━━━━━━━━━━━━━━━━━━

**آخرین فعالیت‌ها:**`;

  // Add last invoice info
  if (lastInvoice) {
    const invoiceStatusEmoji = lastInvoice.status === 'paid' ? '✅' : lastInvoice.status === 'partially_paid' ? '🟡' : '❌';
    const invoiceStatusText = lastInvoice.status === 'paid' ? 'پرداخت شده' : lastInvoice.status === 'partially_paid' ? 'پرداخت جزئی' : 'پرداخت نشده';
    
    text += `
• **آخرین فاکتور:**
  📅 **تاریخ:** ${formatDate(lastInvoice.issueDate)}
  💰 **مبلغ:** ${parseFloat(lastInvoice.amount).toLocaleString()} تومان
  ${invoiceStatusEmoji} **وضعیت:** ${invoiceStatusText}`;
  } else {
    text += `
• **آخرین فاکتور:** هیچ فاکتوری ثبت نشده`;
  }

  // Add last payment info
  if (lastPayment) {
    text += `
• **آخرین پرداخت:**
  📅 **تاریخ:** ${formatDate(lastPayment.paymentDate)}
  💳 **مبلغ:** ${parseFloat(lastPayment.amount).toLocaleString()} تومان
  ⏰ **${summary.daysSinceLastPayment} روز پیش**`;
  } else {
    text += `
• **آخرین پرداخت:** هیچ پرداختی ثبت نشده`;
  }

  // Action buttons
  const reply_markup = {
    inline_keyboard: [
      [
        { text: '💰 ثبت پرداخت جدید', callback_data: `action_payment:${representative.storeName}` },
        { text: '📄 ایجاد فاکتور', callback_data: `action_invoice:${representative.storeName}` }
      ],
      [
        { text: '📜 تاریخچه کامل', callback_data: `full_history:${representative.storeName}` },
        { text: '✏️ ویرایش پروفایل', callback_data: `action_edit:${representative.storeName}` }
      ],
      [
        { text: '📊 آمار تفصیلی', callback_data: `detailed_stats:${representative.storeName}` },
        { text: '🔙 بازگشت', callback_data: 'list_representatives' }
      ]
    ]
  };

  return { text, reply_markup };
}

// Generate detailed transaction history
export async function generateTransactionHistory(representativeName: string): Promise<string> {
  try {
    const representative = await storage.getRepresentativeByStoreName(representativeName);
    if (!representative) {
      return '❌ نماینده مورد نظر یافت نشد.';
    }

    const allInvoices = await storage.getInvoicesByRepresentative(representative.id);
    const allPayments = await storage.getPaymentsByRepresentative(representative.id);

    let history = `📜 **تاریخچه کامل مالی: ${representative.storeName}**\n\n`;

    // Combine and sort all transactions by date
    const transactions: Array<{
      type: 'invoice' | 'payment';
      date: string;
      amount: number;
      status?: string;
      data: Invoice | Payment;
    }> = [
      ...allInvoices.map(inv => ({
        type: 'invoice' as const,
        date: inv.issueDate,
        amount: parseFloat(inv.amount),
        status: inv.status,
        data: inv
      })),
      ...allPayments.map(pay => ({
        type: 'payment' as const,
        date: pay.paymentDate,
        amount: parseFloat(pay.amount),
        data: pay
      }))
    ];

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Display recent 20 transactions
    const recentTransactions = transactions.slice(0, 20);
    
    if (recentTransactions.length === 0) {
      history += '⚪ هیچ تراکنشی ثبت نشده است.';
    } else {
      recentTransactions.forEach((transaction, index) => {
        const date = new Date(transaction.date).toLocaleDateString('fa-IR');
        
        if (transaction.type === 'invoice') {
          const statusEmoji = transaction.status === 'paid' ? '✅' : transaction.status === 'partially_paid' ? '🟡' : '❌';
          history += `${index + 1}. 📄 **فاکتور** - ${date}\n`;
          history += `   💰 ${transaction.amount.toLocaleString()} تومان ${statusEmoji}\n\n`;
        } else {
          history += `${index + 1}. 💳 **پرداخت** - ${date}\n`;
          history += `   💰 ${transaction.amount.toLocaleString()} تومان ✅\n\n`;
        }
      });
      
      if (transactions.length > 20) {
        history += `\n📝 ${transactions.length - 20} تراکنش دیگر موجود است.`;
      }
    }

    return history;

  } catch (error) {
    console.error('Error generating transaction history:', error);
    return '❌ خطا در تولید تاریخچه تراکنش‌ها.';
  }
}

// Parse representative name from various text patterns
export function parseRepresentativeName(text: string): string | null {
  // Pattern matching for Persian text
  const patterns = [
    /پروفایل\s+(.+)/,
    /وضعیت\s+(.+)/,
    /فروشگاه\s+(.+)/,
    /نماینده\s+(.+)/,
    /profile\s+(.+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}