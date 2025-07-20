import express from "express";
import { storage } from "./storage";
import { 
  insertSalesColleagueSchema, insertRepresentativeSchema, insertInvoiceSchema,
  insertInvoiceItemSchema, insertPaymentSchema, insertPaymentAllocationSchema,
  insertSystemSettingsSchema, insertInvoiceTemplateSchema
} from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Error handler
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Sales Colleagues Routes
router.get("/sales-colleagues", asyncHandler(async (req: express.Request, res: express.Response) => {
  const colleagues = await storage.getSalesColleagues();
  res.json({ success: true, data: colleagues });
}));

router.get("/sales-colleagues/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const colleague = await storage.getSalesColleagueById(id);
  
  if (!colleague) {
    return res.status(404).json({ success: false, error: "همکار فروش یافت نشد" });
  }
  
  res.json({ success: true, data: colleague });
}));

router.post("/sales-colleagues", asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = insertSalesColleagueSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const colleague = await storage.createSalesColleague(validation.data);
  res.status(201).json({ success: true, data: colleague });
}));

router.put("/sales-colleagues/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const validation = insertSalesColleagueSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const colleague = await storage.updateSalesColleague(id, validation.data);
  
  if (!colleague) {
    return res.status(404).json({ success: false, error: "همکار فروش یافت نشد" });
  }
  
  res.json({ success: true, data: colleague });
}));

router.delete("/sales-colleagues/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const deleted = await storage.deleteSalesColleague(id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: "همکار فروش یافت نشد" });
  }
  
  res.json({ success: true, message: "همکار فروش با موفقیت حذف شد" });
}));

// Representatives Routes
router.get("/representatives", asyncHandler(async (req: express.Request, res: express.Response) => {
  const representatives = await storage.getRepresentatives();
  res.json({ success: true, data: representatives });
}));

router.get("/representatives/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const representative = await storage.getRepresentativeById(id);
  
  if (!representative) {
    return res.status(404).json({ success: false, error: "نماینده یافت نشد" });
  }
  
  res.json({ success: true, data: representative });
}));

router.post("/representatives", asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = insertRepresentativeSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const representative = await storage.createRepresentative(validation.data);
  res.status(201).json({ success: true, data: representative });
}));

router.put("/representatives/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const validation = insertRepresentativeSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const representative = await storage.updateRepresentative(id, validation.data);
  
  if (!representative) {
    return res.status(404).json({ success: false, error: "نماینده یافت نشد" });
  }
  
  res.json({ success: true, data: representative });
}));

router.put("/representatives/:id/balance", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const { amount } = req.body;
  
  if (typeof amount !== 'number') {
    return res.status(400).json({ success: false, error: "مبلغ باید عدد باشد" });
  }
  
  await storage.updateRepresentativeBalance(id, amount);
  res.json({ success: true, message: "موجودی با موفقیت بروزرسانی شد" });
}));

router.delete("/representatives/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const deleted = await storage.deleteRepresentative(id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: "نماینده یافت نشد" });
  }
  
  res.json({ success: true, message: "نماینده با موفقیت حذف شد" });
}));

// Invoices Routes
router.get("/invoices", asyncHandler(async (req: express.Request, res: express.Response) => {
  const invoices = await storage.getInvoices();
  res.json({ success: true, data: invoices });
}));

router.get("/invoices/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const invoice = await storage.getInvoiceById(id);
  
  if (!invoice) {
    return res.status(404).json({ success: false, error: "فاکتور یافت نشد" });
  }
  
  res.json({ success: true, data: invoice });
}));

router.get("/representatives/:id/invoices", asyncHandler(async (req: express.Request, res: express.Response) => {
  const representativeId = parseInt(req.params.id);
  const invoices = await storage.getInvoicesByRepresentative(representativeId);
  res.json({ success: true, data: invoices });
}));

// Create invoice with items
const createInvoiceSchema = z.object({
  invoice: insertInvoiceSchema,
  items: z.array(insertInvoiceItemSchema.omit({ invoiceId: true }))
});

router.post("/invoices", asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = createInvoiceSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const { invoice: invoiceData, items } = validation.data;
  const invoice = await storage.createInvoice(invoiceData, items);
  res.status(201).json({ success: true, data: invoice });
}));

router.put("/invoices/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const validation = insertInvoiceSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const invoice = await storage.updateInvoice(id, validation.data);
  
  if (!invoice) {
    return res.status(404).json({ success: false, error: "فاکتور یافت نشد" });
  }
  
  res.json({ success: true, data: invoice });
}));

router.delete("/invoices/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const deleted = await storage.deleteInvoice(id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: "فاکتور یافت نشد" });
  }
  
  res.json({ success: true, message: "فاکتور با موفقیت حذف شد" });
}));

// Payments Routes
router.get("/payments", asyncHandler(async (req: express.Request, res: express.Response) => {
  const payments = await storage.getPayments();
  res.json({ success: true, data: payments });
}));

router.get("/representatives/:id/payments", asyncHandler(async (req: express.Request, res: express.Response) => {
  const representativeId = parseInt(req.params.id);
  const payments = await storage.getPaymentsByRepresentative(representativeId);
  res.json({ success: true, data: payments });
}));

router.post("/payments", asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = insertPaymentSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const payment = await storage.createPayment(validation.data);
  res.status(201).json({ success: true, data: payment });
}));

// Allocate payment to invoices
const allocatePaymentSchema = z.object({
  allocations: z.array(insertPaymentAllocationSchema.omit({ paymentId: true }))
});

router.post("/payments/:id/allocate", asyncHandler(async (req: express.Request, res: express.Response) => {
  const paymentId = parseInt(req.params.id);
  const validation = allocatePaymentSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const allocationsWithPaymentId = validation.data.allocations.map(allocation => ({
    ...allocation,
    paymentId
  }));
  
  await storage.allocatePayment(paymentId, allocationsWithPaymentId);
  res.json({ success: true, message: "پرداخت با موفقیت تخصیص یافت" });
}));

router.delete("/payments/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const deleted = await storage.deletePayment(id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: "پرداخت یافت نشد" });
  }
  
  res.json({ success: true, message: "پرداخت با موفقیت حذف شد" });
}));

// Dashboard Routes
router.get("/dashboard/stats", asyncHandler(async (req: express.Request, res: express.Response) => {
  const stats = await storage.getDashboardStats();
  res.json({ success: true, data: stats });
}));

// Audit Logs Routes
router.get("/audit-logs", asyncHandler(async (req: express.Request, res: express.Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const logs = await storage.getAuditLogs(limit);
  res.json({ success: true, data: logs });
}));

// System Settings Routes
router.get("/settings", asyncHandler(async (req: express.Request, res: express.Response) => {
  const settings = await storage.getSystemSettings();
  res.json({ success: true, data: settings });
}));

router.put("/settings/:key", asyncHandler(async (req: express.Request, res: express.Response) => {
  const { key } = req.params;
  const { value } = req.body;
  
  if (typeof value !== 'string') {
    return res.status(400).json({ success: false, error: "مقدار باید رشته باشد" });
  }
  
  await storage.updateSystemSetting(key, value);
  res.json({ success: true, message: "تنظیمات با موفقیت بروزرسانی شد" });
}));

// Invoice Templates Routes
router.get("/invoice-templates", asyncHandler(async (req: express.Request, res: express.Response) => {
  const templates = await storage.getInvoiceTemplates();
  res.json({ success: true, data: templates });
}));

router.get("/invoice-templates/active", asyncHandler(async (req: express.Request, res: express.Response) => {
  const template = await storage.getActiveInvoiceTemplate();
  res.json({ success: true, data: template });
}));

router.post("/invoice-templates", asyncHandler(async (req: express.Request, res: express.Response) => {
  const validation = insertInvoiceTemplateSchema.safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const template = await storage.createInvoiceTemplate(validation.data);
  res.status(201).json({ success: true, data: template });
}));

router.put("/invoice-templates/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
  const id = parseInt(req.params.id);
  const validation = insertInvoiceTemplateSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: "داده‌های ورودی نامعتبر", 
      details: validation.error.errors 
    });
  }
  
  const template = await storage.updateInvoiceTemplate(id, validation.data);
  
  if (!template) {
    return res.status(404).json({ success: false, error: "قالب فاکتور یافت نشد" });
  }
  
  res.json({ success: true, data: template });
}));

// Search Route
router.get("/search", asyncHandler(async (req: express.Request, res: express.Response) => {
  const query = req.query.q as string;
  
  if (!query || query.trim().length === 0) {
    return res.json({ success: true, data: { representatives: [], invoices: [], salesColleagues: [] } });
  }
  
  const results = await storage.searchGlobal(query.trim());
  res.json({ success: true, data: results });
}));

// Demo Data Route
router.post("/demo/create-sample-data", asyncHandler(async (req: express.Request, res: express.Response) => {
  try {
    // Create sample sales colleagues
    const colleague1 = await storage.createSalesColleague({
      name: "احمد محمدی",
      code: "SC001",
      commissionRate: "10.50",
      isActive: true
    });

    const colleague2 = await storage.createSalesColleague({
      name: "فاطمه احمدی",
      code: "SC002", 
      commissionRate: "12.00",
      isActive: true
    });

    // Create sample representatives
    const rep1 = await storage.createRepresentative({
      name: "علی رضایی",
      code: "REP001",
      storeName: "فروشگاه دیجیتال آسمان",
      phone: "09123456789",
      panelUsername: "ali_rezaei",
      salesColleagueId: colleague1.id,
      creditLimit: "2000000",
      isActive: true
    });

    const rep2 = await storage.createRepresentative({
      name: "مریم حسینی",
      code: "REP002", 
      storeName: "شرکت نت پلاس",
      phone: "09987654321",
      panelUsername: "maryam_hosseini",
      salesColleagueId: colleague2.id,
      creditLimit: "1500000",
      isActive: true
    });

    const rep3 = await storage.createRepresentative({
      name: "حسن کریمی",
      code: "REP003",
      storeName: "سرویس های اینترنتی پارس",
      phone: "09555555555",
      panelUsername: "hassan_karimi",
      salesColleagueId: colleague1.id,
      creditLimit: "3000000",
      isActive: true
    });

    // Create sample invoices
    const invoice1 = await storage.createInvoice({
      representativeId: rep1.id,
      totalAmount: "500000",
      commissionAmount: "52500",
      finalAmount: "447500",
      status: "paid",
      notes: "فاکتور ماهانه - دی 1403"
    }, [
      {
        description: "سرویس پروکسی پریمیوم - 1 ماه",
        quantity: 10,
        unitPrice: "50000",
        totalPrice: "500000"
      }
    ]);

    const invoice2 = await storage.createInvoice({
      representativeId: rep2.id,
      totalAmount: "750000",
      commissionAmount: "90000", 
      finalAmount: "660000",
      status: "unpaid",
      notes: "فاکتور ماهانه - دی 1403"
    }, [
      {
        description: "سرویس پروکسی استاندارد - 1 ماه",
        quantity: 15,
        unitPrice: "50000",
        totalPrice: "750000"
      }
    ]);

    const invoice3 = await storage.createInvoice({
      representativeId: rep3.id,
      totalAmount: "300000",
      commissionAmount: "31500",
      finalAmount: "268500", 
      status: "overdue",
      notes: "فاکتور ماهانه - آذر 1403"
    }, [
      {
        description: "سرویس پروکسی پایه - 1 ماه",
        quantity: 6,
        unitPrice: "50000",
        totalPrice: "300000"
      }
    ]);

    // Create sample payments
    await storage.createPayment({
      representativeId: rep1.id,
      amount: "447500",
      paymentMethod: "bank_transfer",
      referenceNumber: "TXN123456789",
      notes: "پرداخت کامل فاکتور"
    });

    await storage.createPayment({
      representativeId: rep2.id,
      amount: "300000",
      paymentMethod: "cash",
      notes: "پرداخت جزئی"
    });

    // Update system settings
    await storage.updateSystemSetting("company_name", "شرکت پروکسی سرویس V2Ray");
    await storage.updateSystemSetting("default_commission_rate", "10");
    await storage.updateSystemSetting("currency", "تومان");

    res.json({ 
      success: true, 
      message: "دادهای نمونه با موفقیت ایجاد شد",
      data: {
        salesColleagues: 2,
        representatives: 3,
        invoices: 3,
        payments: 2
      }
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({ 
      success: false, 
      error: "خطا در ایجاد دادهای نمونه"
    });
  }
}));

// Reports Routes
router.get("/reports/aging", asyncHandler(async (req: express.Request, res: express.Response) => {
  // TODO: Implement aging report
  res.json({ success: true, data: [] });
}));

router.get("/reports/commission", asyncHandler(async (req: express.Request, res: express.Response) => {
  // TODO: Implement commission report
  res.json({ success: true, data: [] });
}));

router.get("/reports/performance", asyncHandler(async (req: express.Request, res: express.Response) => {
  // TODO: Implement performance report
  res.json({ success: true, data: [] });
}));

// Error handler
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    success: false, 
    error: "خطای سرور", 
    details: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
});

export default router;