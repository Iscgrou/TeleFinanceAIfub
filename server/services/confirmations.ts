import { nanoid } from 'nanoid';

// Interface for pending actions that require confirmation
export interface PendingAction {
  id: string;
  chatId: string;
  description: string;
  toolCalls: Array<{
    name: string;
    args: Record<string, any>;
  }>;
  timestamp: Date;
}

// In-memory store for pending actions (in production, use Redis or database)
const pendingActions = new Map<string, PendingAction>();

// Create a new pending action requiring confirmation
export function createPendingAction(
  chatId: string,
  description: string,
  toolCalls: Array<{ name: string; args: Record<string, any> }>
): string {
  const actionId = nanoid(10);
  const pendingAction: PendingAction = {
    id: actionId,
    chatId,
    description,
    toolCalls,
    timestamp: new Date()
  };

  pendingActions.set(actionId, pendingAction);

  // Clean up old pending actions (older than 10 minutes)
  setTimeout(() => {
    pendingActions.delete(actionId);
  }, 10 * 60 * 1000);

  return actionId;
}

// Retrieve a pending action by ID
export function getPendingAction(actionId: string): PendingAction | undefined {
  return pendingActions.get(actionId);
}

// Remove a pending action (after confirmation or cancellation)
export function removePendingAction(actionId: string): void {
  pendingActions.delete(actionId);
}

// Check if an action is destructive (modifies database)
export function isDestructiveAction(toolName: string): boolean {
  const destructiveActions = [
    'process_weekly_invoices',
    'register_payment', 
    'create_manual_invoice',
    'calculate_commissions',
    'send_telegram_message'
  ];
  
  return destructiveActions.includes(toolName);
}

// Generate human-readable description of planned actions
export function generateActionDescription(toolCalls: Array<{ name: string; args: Record<string, any> }>): string {
  const descriptions = toolCalls.map((call, index) => {
    const { name, args } = call;
    let actionDesc = '';

    switch (name) {
      case 'process_weekly_invoices':
        actionDesc = 'صدور فاکتورهای هفتگی برای تمام نمایندگان بر اساس داده‌های مصرف';
        break;
      case 'register_payment':
        actionDesc = `ثبت پرداخت ${args.amount?.toLocaleString()} تومان برای '${args.representative_name}'`;
        break;
      case 'create_manual_invoice':
        actionDesc = `ایجاد فاکتور دستی ${args.amount?.toLocaleString()} تومان برای '${args.representative_name}'`;
        break;
      case 'calculate_commissions':
        const days = args.period_days || 7;
        actionDesc = `محاسبه کمیسیون همکاران فروش برای ${days} روز گذشته`;
        break;
      case 'send_telegram_message':
        actionDesc = `ارسال پیام تلگرام برای '${args.recipient_name}': "${args.message_text}"`;
        break;
      case 'find_representative_with_highest_debt':
        actionDesc = 'یافتن نماینده با بیشترین بدهی';
        break;
      case 'get_representative_status':
        actionDesc = `بررسی وضعیت نماینده '${args.representative_name}'`;
        break;
      case 'get_financial_summary':
        const period = args.period_days || 30;
        actionDesc = `تهیه خلاصه مالی ${period} روز گذشته`;
        break;
      default:
        actionDesc = `اجرای عملیات: ${name}`;
    }

    return `${index + 1}. ${actionDesc}`;
  });

  return descriptions.join('\n');
}

// Format confirmation message
export function formatConfirmationMessage(description: string, actionId: string): {
  text: string;
  reply_markup: any;
} {
  const text = `⚠️ درخواست تاییدیه ⚠️

من قصد دارم عملیات زیر را انجام دهم:

${description}

آیا این عملیات را تایید می‌کنید؟

⚠️ CONFIRMATION REQUIRED ⚠️

I plan to perform the following operations:

${description}

Do you confirm these operations?`;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: '✅ بله، انجام بده', callback_data: `confirm_action:${actionId}` },
        { text: '❌ خیر، لغو کن', callback_data: `cancel_action:${actionId}` }
      ]
    ]
  };

  return { text, reply_markup };
}