// Initialize Default Reminder Templates and Rules
import { db } from '../db';
import { messageTemplates, reminderRules } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function initializeDefaultReminders() {
  console.log('🔄 Initializing default reminder templates and rules...');

  try {
    // Initialize default message templates
    await createDefaultTemplates();
    
    // Initialize default reminder rules
    await createDefaultRules();
    
    console.log('✅ Default reminders initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize default reminders:', error);
  }
}

async function createDefaultTemplates() {
  const defaultTemplates = [
    {
      name: 'Telegram Payment Reminder - Persian',
      language: 'fa',
      channel: 'telegram',
      content: `سلام {{representativeName}} عزیز 👋

🏪 فروشگاه: {{storeName}}
💰 مبلغ بدهی: {{debtAmount}} تومان
📅 روزهای معوق: {{daysOverdue}} روز

لطفاً در اسرع وقت نسبت به تسویه حساب اقدام فرمایید.

🔗 پنل کاربری: {{panelUsername}}

با تشکر
تیم مالی`,
      variables: {
        representativeName: { type: 'string' },
        storeName: { type: 'string' },
        debtAmount: { type: 'currency' },
        daysOverdue: { type: 'number' },
        panelUsername: { type: 'string' }
      }
    },
    {
      name: 'SMS Payment Reminder - Persian',
      language: 'fa',
      channel: 'sms',
      content: `سلام {{representativeName}}
بدهی {{debtAmount}} تومان - {{daysOverdue}} روز معوق
لطفاً تسویه فرمایید.
پنل: {{panelUsername}}`,
      variables: {
        representativeName: { type: 'string' },
        debtAmount: { type: 'currency' },
        daysOverdue: { type: 'number' },
        panelUsername: { type: 'string' }
      }
    },
    {
      name: 'Email Payment Reminder - Persian',
      language: 'fa',
      channel: 'email',
      subject: 'یادآوری تسویه حساب - {{storeName}}',
      content: `{{representativeName}} محترم،

با سلام و احترام

این ایمیل به منظور یادآوری تسویه حساب معوقه شما ارسال می‌شود:

📊 جزئیات بدهی:
🏪 نام فروشگاه: {{storeName}}
💰 مبلغ کل بدهی: {{debtAmount}} تومان
📅 تعداد روزهای معوق: {{daysOverdue}} روز
👤 نام کاربری پنل: {{panelUsername}}

لطفاً در اسرع وقت نسبت به تسویه حساب خود اقدام فرمایید.

در صورت داشتن هرگونه سوال، با تیم پشتیبانی ما در تماس باشید.

با تشکر
تیم مالی`,
      variables: {
        representativeName: { type: 'string' },
        storeName: { type: 'string' },
        debtAmount: { type: 'currency' },
        daysOverdue: { type: 'number' },
        panelUsername: { type: 'string' }
      }
    },
    {
      name: 'High Priority Reminder - Persian',
      language: 'fa',
      channel: 'telegram',
      content: `🚨 اخطار مهم {{representativeName}} عزیز

🏪 فروشگاه: {{storeName}}
💰 مبلغ بدهی: {{debtAmount}} تومان
📅 روزهای معوق: {{daysOverdue}} روز

⚠️ بدهی شما به مرحله بحرانی رسیده است.
لطفاً فوراً نسبت به تسویه حساب اقدام فرمایید.

در غیر این صورت مجبور به اتخاذ تدابیر قانونی خواهیم بود.

📞 تماس فوری: 02112345678
🔗 پنل: {{panelUsername}}

تیم مالی`,
      variables: {
        representativeName: { type: 'string' },
        storeName: { type: 'string' },
        debtAmount: { type: 'currency' },
        daysOverdue: { type: 'number' },
        panelUsername: { type: 'string' }
      }
    }
  ];

  for (const template of defaultTemplates) {
    try {
      // Check if template already exists
      const existing = await db
        .select()
        .from(messageTemplates)
        .where(eq(messageTemplates.name, template.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(messageTemplates).values(template);
        console.log(`✅ Created template: ${template.name}`);
      } else {
        console.log(`⏭️ Template already exists: ${template.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create template ${template.name}:`, error);
    }
  }
}

async function createDefaultRules() {
  const defaultRules = [
    {
      name: 'Weekly Payment Reminder',
      triggerConditions: {
        debtAmountMin: 100000, // 100,000 Toman minimum debt
        daysOverdue: 7 // 7 days overdue
      },
      schedulePattern: '0 9 * * 1', // Every Monday at 9 AM
      channels: ['telegram'],
      isActive: true
    },
    {
      name: 'High Priority Daily Reminder',
      triggerConditions: {
        debtAmountMin: 1000000, // 1 million Toman minimum debt
        daysOverdue: 30 // 30 days overdue
      },
      schedulePattern: '0 9 * * *', // Every day at 9 AM
      channels: ['telegram', 'sms'],
      isActive: true
    },
    {
      name: 'Monthly Email Reminder',
      triggerConditions: {
        debtAmountMin: 50000, // 50,000 Toman minimum debt
        daysOverdue: 1 // Any overdue amount
      },
      schedulePattern: '0 10 1 * *', // First day of month at 10 AM
      channels: ['email'],
      isActive: false // Start disabled
    },
    {
      name: 'Critical Debt Alert',
      triggerConditions: {
        debtAmountMin: 5000000, // 5 million Toman minimum debt
        daysOverdue: 60 // 60 days overdue
      },
      schedulePattern: '0 8 * * 1,3,5', // Monday, Wednesday, Friday at 8 AM
      channels: ['telegram', 'sms', 'email'],
      isActive: true
    }
  ];

  for (const rule of defaultRules) {
    try {
      // Check if rule already exists
      const existing = await db
        .select()
        .from(reminderRules)
        .where(eq(reminderRules.name, rule.name))
        .limit(1);

      if (existing.length === 0) {
        // Get template ID for the appropriate channel
        const template = await db
          .select()
          .from(messageTemplates)
          .where(eq(messageTemplates.channel, rule.channels[0]))
          .limit(1);

        const templateId = template.length > 0 ? template[0].id : undefined;

        await db.insert(reminderRules).values({
          ...rule,
          triggerConditions: rule.triggerConditions as any,
          templateId
        });
        
        console.log(`✅ Created rule: ${rule.name}`);
      } else {
        console.log(`⏭️ Rule already exists: ${rule.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create rule ${rule.name}:`, error);
    }
  }
}

export async function getSystemStatus() {
  try {
    const templates = await db.select().from(messageTemplates);
    const rules = await db.select().from(reminderRules);
    
    return {
      templates: {
        total: templates.length,
        byChannel: {
          telegram: templates.filter(t => t.channel === 'telegram').length,
          sms: templates.filter(t => t.channel === 'sms').length,
          email: templates.filter(t => t.channel === 'email').length
        }
      },
      rules: {
        total: rules.length,
        active: rules.filter(r => r.isActive).length,
        inactive: rules.filter(r => !r.isActive).length
      }
    };
  } catch (error) {
    console.error('❌ Failed to get system status:', error);
    return { error: 'Failed to get system status' };
  }
}