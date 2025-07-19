import { Request, Response } from 'express';
import { storage } from '../storage';
import { financialAgent } from '../services/agent';

// Database is now clean - ready for production use
export async function createSampleData(req: Request, res: Response): Promise<void> {
  res.json({
    success: false,
    message: 'Sample data creation disabled - system is ready for production use',
    note: 'Upload your usage.json file to process real transactions'
  });
}

// Test AI agent with sample commands
export async function testAIAgent(req: Request, res: Response): Promise<void> {
  try {
    const { command } = req.body;
    
    if (!command) {
      res.status(400).json({ error: 'Command is required' });
      return;
    }

    const result = await financialAgent.processCommand(command);

    res.json({
      success: true,
      command,
      result
    });

  } catch (error) {
    console.error('Error testing AI agent:', error);
    res.status(500).json({ error: 'Failed to process command' });
  }
}

// Get sample commands for testing
export async function getSampleCommands(req: Request, res: Response): Promise<void> {
  const sampleCommands = [
    {
      category: 'Financial Queries',
      commands: [
        'کل بدهی نمایندگان چقدره؟',
        'نماینده با بیشترین بدهی کیه؟',
        'خلاصه وضعیت مالی این ماه رو بده',
        'وضعیت فروشگاه اکباتان رو بررسی کن'
      ]
    },
    {
      category: 'Invoice Management',
      commands: [
        'برای فروشگاه تهران یه فاکتور ۵ میلیون تومانی بزن',
        'فاکتور دستی برای خدمات اضافی صادر کن',
        'لیست فاکتورهای پرداخت نشده رو نشون بده'
      ]
    },
    {
      category: 'Payment Processing',
      commands: [
        'پرداخت ۳ میلیون تومانی از فروشگاه اکباتان ثبت کن',
        'آخرین پرداخت‌های دریافتی رو نشون بده',
        'بدهی فروشگاه پارس رو به‌روزرسانی کن'
      ]
    },
    {
      category: 'Commission Management',
      commands: [
        'کمیسیون همکاران فروش این هفته رو محاسبه کن',
        'وضعیت پرداخت کمیسیون‌ها رو بررسی کن',
        'کمیسیون احمد محمدی چقدره؟'
      ]
    },
    {
      category: 'Complex Multi-step Operations',
      commands: [
        'خلاصه عملکرد این ماه رو تهیه کن و نماینده با بیشترین بدهی رو پیدا کن',
        'فاکتورهای پرداخت نشده رو بررسی کن و برای اونایی که بیش از ۱۰ میلیون بدهی دارن پیام هشدار بفرست',
        'کمیسیون‌ها رو محاسبه کن و یه گزارش کامل از وضعیت مالی بده'
      ]
    },
    {
      category: 'عملیات‌های گروهی پیشرفته',
      commands: [
        'برای تمام بدهکارانی که بدهی بالای یک میلیون دارند پیام یادآوری بفرست',
        'برای همه فروشگاه‌هایی که نامشون شامل "مرکز" میشه هشدار بدهی بفرست',
        'برای نمایندگانی که ۳۰ روزه پرداختی نداشتند پیام اخطار آماده کن'
      ]
    },
    {
      category: 'پروفایل‌های مالی',
      commands: [
        'پروفایل مالی کامل فروشگاه اکباتان رو نشون بده',
        'تاریخچه کامل تراکنش‌های فروشگاه تجارت رو بده',
        'آمار تفصیلی مالی فروشگاه مرکزی رو تهیه کن'
      ]
    },
    {
      category: 'پروتکل ثبت غیرقابل‌تغییر (Immutable Ledger)',
      commands: [
        'فایل usage.json رو پردازش کن',
        'فاکتورهای امروز رو به صورت تصویر آماده کن',
        'فاکتورهای پرداخت نشده رو به صورت PNG تولید کن',
        'فاکتور شماره 5 رو به صورت تصویر نشون بده'
      ]
    }
  ];

  res.json({
    success: true,
    sampleCommands,
    note: 'These commands demonstrate the AI agent\'s ability to handle complex financial operations in Persian'
  });
}