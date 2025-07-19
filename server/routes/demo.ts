import { Request, Response } from 'express';
import { storage } from '../storage';
import { financialAgent } from '../services/agent';

// Create sample data to demonstrate the AI agent capabilities
export async function createSampleData(req: Request, res: Response): Promise<void> {
  try {
    // Create sample sales colleagues
    const colleague1 = await storage.createSalesColleague({
      name: 'احمد محمدی',
      commissionRate: 5.0,
      phone: '09123456789'
    });

    const colleague2 = await storage.createSalesColleague({
      name: 'فاطمه احمدی',
      commissionRate: 7.5,
      phone: '09987654321'
    });

    // Create sample representatives
    const rep1 = await storage.createRepresentative({
      storeName: 'فروشگاه اکباتان',
      ownerName: 'علی رضایی',
      phone: '02188776655',
      totalDebt: '15000000',
      isActive: true,
      colleagueId: colleague1.id
    });

    const rep2 = await storage.createRepresentative({
      storeName: 'مرکز خرید پارس',
      ownerName: 'مریم کریمی',
      phone: '02177665544',
      totalDebt: '8500000',
      isActive: true,
      colleagueId: colleague2.id
    });

    const rep3 = await storage.createRepresentative({
      storeName: 'فروشگاه تهران',
      ownerName: 'محمد حسینی',
      phone: '02166554433',
      totalDebt: '3200000',
      isActive: true,
      colleagueId: colleague1.id
    });

    // Create sample invoices
    await storage.createInvoice({
      representativeId: rep1.id,
      amount: '5000000',
      description: 'فاکتور هفتگی - استفاده از سرویس پروکسی',
      status: 'unpaid',
      isManual: false
    });

    await storage.createInvoice({
      representativeId: rep2.id,
      amount: '3500000',
      description: 'فاکتور هفتگی - استفاده از سرویس پروکسی',
      status: 'partially_paid',
      isManual: false
    });

    await storage.createInvoice({
      representativeId: rep3.id,
      amount: '2200000',
      description: 'فاکتور دستی - خدمات اضافی',
      status: 'paid',
      isManual: true
    });

    // Create sample payments
    await storage.createPayment({
      representativeId: rep2.id,
      amount: '2000000',
      notes: 'پرداخت جزئی بابت فاکتور جاری'
    });

    await storage.createPayment({
      representativeId: rep3.id,
      amount: '2200000',
      notes: 'تسویه کامل فاکتور'
    });

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        colleagues: [colleague1, colleague2],
        representatives: [rep1, rep2, rep3],
        summary: 'Data includes sales colleagues, representatives, invoices, and payments for testing AI capabilities'
      }
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ error: 'Failed to create sample data' });
  }
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
    }
  ];

  res.json({
    success: true,
    sampleCommands,
    note: 'These commands demonstrate the AI agent\'s ability to handle complex financial operations in Persian'
  });
}