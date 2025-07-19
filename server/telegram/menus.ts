import { sendInlineKeyboard, sendMessage } from './bot';

// Main menu structure
export const MAIN_MENU = {
  text: `📋 منوی اصلی سیستم مدیریت مالی

لطفا یکی از گزینه‌های زیر را انتخاب کنید:

📋 Main Menu - Financial Management System

Please select one of the options below:`,
  
  keyboard: [
    [
      { text: '👤 نمایندگان', callback_data: 'menu_representatives' },
      { text: '👥 همکاران فروش', callback_data: 'menu_colleagues' }
    ],
    [
      { text: '⚙️ عملیات مالی', callback_data: 'menu_financial' },
      { text: '📊 گزارش‌گیری', callback_data: 'menu_reports' }
    ],
    [
      { text: '🤖 دستیار هوشمند', callback_data: 'menu_ai_assistant' },
      { text: '⚙️ تنظیمات', callback_data: 'menu_settings' }
    ]
  ]
};

// Representatives submenu
export const REPRESENTATIVES_MENU = {
  text: `👤 مدیریت نمایندگان

👤 Representatives Management`,
  
  keyboard: [
    [
      { text: '➕ افزودن نماینده', callback_data: 'add_representative' },
      { text: '🔍 جستجوی نماینده', callback_data: 'search_representative' }
    ],
    [
      { text: '📊 لیست همه نمایندگان', callback_data: 'list_representatives' },
      { text: '💰 نمایندگان بدهکار', callback_data: 'debtors_list' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// Sales colleagues submenu
export const COLLEAGUES_MENU = {
  text: `👥 مدیریت همکاران فروش

👥 Sales Colleagues Management`,
  
  keyboard: [
    [
      { text: '➕ افزودن همکار', callback_data: 'add_colleague' },
      { text: '📊 لیست همکاران', callback_data: 'list_colleagues' }
    ],
    [
      { text: '💰 محاسبه کمیسیون', callback_data: 'calculate_commissions' },
      { text: '💳 پرداخت کمیسیون‌ها', callback_data: 'payout_commissions' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// Financial operations submenu  
export const FINANCIAL_MENU = {
  text: `⚙️ عملیات مالی

⚙️ Financial Operations`,
  
  keyboard: [
    [
      { text: '💰 ثبت پرداخت', callback_data: 'register_payment' },
      { text: '📄 صدور فاکتور دستی', callback_data: 'create_invoice' }
    ],
    [
      { text: '📈 فاکتورهای هفتگی', callback_data: 'weekly_invoices' },
      { text: '💳 سابقه پرداخت‌ها', callback_data: 'payment_history' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// Reports submenu
export const REPORTS_MENU = {
  text: `📊 گزارش‌گیری

📊 Reports`,
  
  keyboard: [
    [
      { text: '📈 خلاصه مالی', callback_data: 'financial_summary' },
      { text: '📊 آمار داشبورد', callback_data: 'dashboard_stats' }
    ],
    [
      { text: '💰 گزارش بدهی‌ها', callback_data: 'debt_report' },
      { text: '💳 گزارش کمیسیون‌ها', callback_data: 'commission_report' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// AI Assistant submenu
export const AI_ASSISTANT_MENU = {
  text: `🤖 دستیار هوشمند

می‌توانید با من به زبان فارسی صحبت کرده و درخواست‌های خود را بیان کنید. من قادر هستم عملیات پیچیده چندمرحله‌ای را انجام دهم.

🤖 AI Assistant

You can talk to me in Persian and express your requests. I can perform complex multi-step operations.

نمونه دستورات:
• "بیشترین بدهکار رو پیدا کن و براش پیام هشدار بفرست"
• "فاکتورهای این هفته رو صادر کن"
• "خلاصه وضعیت مالی بده"`,
  
  keyboard: [
    [
      { text: '💬 شروع گفتگو', callback_data: 'start_ai_conversation' },
      { text: '📝 نمونه دستورات', callback_data: 'sample_commands' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// Settings submenu (super admin only)
export const SETTINGS_MENU = {
  text: `⚙️ تنظیمات سیستم

⚙️ System Settings`,
  
  keyboard: [
    [
      { text: '👥 مدیریت ادمین‌ها', callback_data: 'manage_admins' },
      { text: '🔧 تنظیمات API', callback_data: 'api_settings' }
    ],
    [
      { text: '🌐 داشبورد وب', callback_data: 'dashboard' },
      { text: '⚙️ تنظیمات وب', callback_data: 'settings' }
    ],
    [
      { text: '🔙 بازگشت به منوی اصلی', callback_data: 'main_menu' }
    ]
  ]
};

// Send main menu
export async function sendMainMenu(chatId: string): Promise<void> {
  await sendInlineKeyboard(chatId, MAIN_MENU.text, MAIN_MENU.keyboard);
}

// Send submenu based on callback data
export async function sendSubmenu(chatId: string, menuType: string): Promise<void> {
  let menu;
  
  switch (menuType) {
    case 'menu_representatives':
      menu = REPRESENTATIVES_MENU;
      break;
    case 'menu_colleagues':
      menu = COLLEAGUES_MENU;
      break;
    case 'menu_financial':
      menu = FINANCIAL_MENU;
      break;
    case 'menu_reports':
      menu = REPORTS_MENU;
      break;
    case 'menu_ai_assistant':
      menu = AI_ASSISTANT_MENU;
      break;
    case 'menu_settings':
      menu = SETTINGS_MENU;
      break;
    default:
      await sendMainMenu(chatId);
      return;
  }
  
  await sendInlineKeyboard(chatId, menu.text, menu.keyboard);
}

// Generate contextual action buttons for representatives
export function getRepresentativeActionButtons(representativeName: string): any[][] {
  return [
    [
      { text: '💰 ثبت پرداخت', callback_data: `action_payment:${representativeName}` },
      { text: '📜 سابقه مالی', callback_data: `action_history:${representativeName}` }
    ],
    [
      { text: '✏️ ویرایش اطلاعات', callback_data: `action_edit:${representativeName}` },
      { text: '📄 ایجاد فاکتور', callback_data: `action_invoice:${representativeName}` }
    ],
    [
      { text: '🔙 بازگشت به لیست نمایندگان', callback_data: 'list_representatives' }
    ]
  ];
}

// Sample AI commands
export const SAMPLE_AI_COMMANDS = [
  '🔍 "وضعیت فروشگاه اکباتان رو بررسی کن"',
  '💰 "بیشترین بدهکار رو پیدا کن"', 
  '📊 "خلاصه مالی این ماه رو بده"',
  '💳 "پرداخت ۵ میلیون تومانی از فروشگاه تهران ثبت کن"',
  '📄 "فاکتور ۳ میلیون تومانی برای فروشگاه پارس بزن"',
  '🧮 "کمیسیون همکاران این هفته رو محاسبه کن"',
  '🔔 "برای بدهکارای بالای ۱۰ میلیون پیام هشدار بفرست"',
  '📈 "فاکتورهای هفتگی رو صادر کن و خلاصه‌ای بده"'
];