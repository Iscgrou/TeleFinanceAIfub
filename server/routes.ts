import type { Express } from "express";
import { createServer, type Server } from "http";
import { securityMiddleware, rateLimitMiddleware } from "./middleware/security";
import { storage } from "./storage";
import { 
  insertSystemSettingsSchema,
  insertRepresentativeSchema,
  insertInvoiceSchema,
  insertPaymentSchema,
  insertSalesColleagueSchema
} from "@shared/schema";
import { initializeBot } from "./telegram/bot";
import { generateInvoiceImage } from "./services/svg-invoice-generator";
import { registerTelegramTestRoutes } from "./routes/test-telegram";

export async function registerRoutes(app: Express): Promise<Server> {
  // Disable aggressive security for development
  // app.use(securityMiddleware);
  // app.use(rateLimitMiddleware(1000, 15)); // Disabled for development
  
  // Test invoice generation endpoint
  app.get("/api/test/invoice/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      console.log(`Testing invoice generation for ID: ${invoiceId}`);
      
      // Debug: Check if data exists first
      const testInvoice = await storage.getInvoiceById(invoiceId);
      console.log('Found invoice:', testInvoice ? `ID ${testInvoice.id}, Amount: ${testInvoice.amount}` : 'null');
      
      if (!testInvoice) {
        return res.status(404).json({ error: 'Invoice not found in database' });
      }
      
      const testRep = await storage.getRepresentativeById(testInvoice.representativeId);
      console.log('Found representative:', testRep ? `ID ${testRep.id}, Store: ${testRep.storeName}` : 'null');
      
      if (!testRep) {
        return res.status(404).json({ error: 'Representative not found in database' });
      }
      
      console.log('Generating image for invoice...');
      const imageBuffer = await generateInvoiceImage(invoiceId);
      console.log('Image generation result:', imageBuffer ? `Success - ${imageBuffer.length} bytes` : 'Failed - null returned');
      
      if (imageBuffer) {
        // Check if it's SVG or PNG based on content
        const isSvg = imageBuffer.toString().startsWith('<svg');
        if (isSvg) {
          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoiceId}.svg"`);
        } else {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoiceId}.png"`);
        }
        res.send(imageBuffer);
      } else {
        res.status(404).json({ error: 'Invoice generation failed - Image generator returned null' });
      }
    } catch (error) {
      console.error('Invoice generation test error:', error);
      res.status(500).json({ error: 'Invoice generation failed', details: error.message });
    }
  });

  // Dashboard API routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  app.get("/api/representatives", async (req, res) => {
    console.log("🔍 [CRITICAL DEBUG] Representatives endpoint called");
    console.log("🔍 [CRITICAL DEBUG] DATABASE_URL:", process.env.DATABASE_URL ? 
      `Connected to: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'UNKNOWN'}` : 'NOT SET');
    
    try {
      console.log("🔍 [CRITICAL DEBUG] Calling storage.getRepresentatives()...");
      const representatives = await storage.getRepresentatives();
      console.log("🔍 [CRITICAL DEBUG] Retrieved representatives count:", representatives?.length || 0);
      console.log("🔍 [CRITICAL DEBUG] Sample data:", representatives?.slice(0, 2).map(r => ({
        id: r.id,
        storeName: r.storeName,
        totalDebt: r.totalDebt
      })));
      
      // Return data in format compatible with both frontend structures
      res.json({
        data: representatives,
        representatives: representatives, // Legacy compatibility
        total: representatives.length,
        success: true
      });
    } catch (error) {
      console.error("🚨 [CRITICAL ERROR] Representatives fetch failed:", error);
      res.status(500).json({ message: "Error fetching representatives" });
    }
  });

  // Create new representative
  app.post("/api/representatives", async (req, res) => {
    try {
      const validatedData = insertRepresentativeSchema.parse(req.body);
      const representative = await storage.createRepresentative(validatedData);
      res.status(201).json(representative);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid representative data" });
      } else {
        res.status(500).json({ message: "خطا در ایجاد نماینده" });
      }
    }
  });

  // Update representative
  app.patch("/api/representatives/:id", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const updatedRep = await storage.updateRepresentative(representativeId, req.body);
      
      if (!updatedRep) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      
      res.json(updatedRep);
    } catch (error) {
      res.status(500).json({ message: "خطا در بروزرسانی نماینده" });
    }
  });

  // Delete representative
  app.delete("/api/representatives/:id", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const deleted = await storage.deleteRepresentative(representativeId);
      
      if (!deleted) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف نماینده" });
    }
  });

  // Representative portal endpoints
  app.get("/api/representatives/by-username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const representative = await storage.getRepresentativeByPanelUsername(username);
      if (!representative) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      res.json(representative);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات نماینده" });
    }
  });

  app.get("/api/representatives/:id/invoices", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const invoices = await storage.getInvoicesByRepresentative(representativeId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتورها" });
    }
  });

  app.get("/api/invoices/:id/detail", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }

      // Parse usage details to line items
      let lineItems = [];
      if (invoice.usageJsonDetails) {
        try {
          const details = invoice.usageJsonDetails;
          if (Array.isArray(details)) {
            lineItems = details.map((item: any) => ({
              description: item.description || 'ایجاد کاربر',
              amount: parseFloat(item.amount || '0'),
              date: item.event_timestamp || invoice.issueDate
            }));
          }
        } catch (error) {
          console.log('Error parsing usage details:', error);
        }
      }

      res.json({
        invoice,
        lineItems
      });
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت جزئیات فاکتور" });
    }
  });



  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid invoice data" });
      } else {
        res.status(500).json({ message: "خطا در ایجاد فاکتور" });
      }
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const validatedData = req.body;
      
      // Validate status if provided
      if (validatedData.status && !['unpaid', 'partially_paid', 'paid'].includes(validatedData.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, validatedData);
      
      if (!updatedInvoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      res.status(500).json({ message: "خطا در بروزرسانی فاکتور" });
    }
  });

  // Process weekly invoices
  app.post("/api/invoices/process-weekly", async (req, res) => {
    try {
      const result = await storage.processWeeklyInvoices(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "خطا در پردازش فاکتورهای هفتگی" });
    }
  });

  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت پرداخت‌ها" });
    }
  });

  // Create new payment
  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      
      // Additional validation for amount
      const amount = parseFloat(validatedData.amount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: "مبلغ نامعتبر است" });
      }
      
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "اطلاعات پرداخت نامعتبر است" });
      } else {
        res.status(500).json({ message: "خطا در ثبت پرداخت" });
      }
    }
  });

  // Get payments for a specific representative
  app.get("/api/payments/representative/:id", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByRepresentative(representativeId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت پرداخت‌های نماینده" });
    }
  });

  // Update payment
  app.patch("/api/payments/:id", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "پرداخت یافت نشد" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      res.status(500).json({ message: "خطا در بروزرسانی پرداخت" });
    }
  });

  // Delete payment
  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const deleted = await storage.deletePayment(paymentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "پرداخت یافت نشد" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف پرداخت" });
    }
  });

  app.get("/api/sales-colleagues", async (req, res) => {
    try {
      const colleagues = await storage.getSalesColleagues();
      res.json(colleagues);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales colleagues" });
    }
  });

  // Create new sales colleague
  app.post("/api/sales-colleagues", async (req, res) => {
    try {
      const validatedData = insertSalesColleagueSchema.parse(req.body);
      const colleague = await storage.createSalesColleague(validatedData);
      res.status(201).json(colleague);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid sales colleague data" });
      } else {
        res.status(500).json({ message: "خطا در ایجاد همکار فروش" });
      }
    }
  });

  // Update sales colleague
  app.patch("/api/sales-colleagues/:id", async (req, res) => {
    try {
      const colleagueId = parseInt(req.params.id);
      const updatedColleague = await storage.updateSalesColleague(colleagueId, req.body);
      
      if (!updatedColleague) {
        return res.status(404).json({ message: "همکار فروش یافت نشد" });
      }
      
      res.json(updatedColleague);
    } catch (error) {
      res.status(500).json({ message: "خطا در بروزرسانی همکار فروش" });
    }
  });

  // Delete sales colleague
  app.delete("/api/sales-colleagues/:id", async (req, res) => {
    try {
      const colleagueId = parseInt(req.params.id);
      const deleted = await storage.deleteSalesColleague(colleagueId);
      
      if (!deleted) {
        return res.status(404).json({ message: "همکار فروش یافت نشد" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "خطا در حذف همکار فروش" });
    }
  });

  // Get sales colleague by ID
  app.get("/api/sales-colleagues/:id", async (req, res) => {
    try {
      const colleagueId = parseInt(req.params.id);
      const colleague = await storage.getSalesColleagueById(colleagueId);
      
      if (!colleague) {
        return res.status(404).json({ message: "همکار فروش یافت نشد" });
      }
      
      res.json(colleague);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات همکار فروش" });
    }
  });



  // Demo/Testing routes
  app.post("/api/demo/create-sample-data", async (req, res) => {
    try {
      const { createSampleData } = await import('./routes/demo');
      await createSampleData(req, res);
    } catch (error) {
      res.status(500).json({ message: "Error creating sample data" });
    }
  });

  app.post("/api/demo/test-ai", async (req, res) => {
    try {
      const { testAIAgent } = await import('./routes/demo');
      await testAIAgent(req, res);
    } catch (error) {
      res.status(500).json({ message: "Error testing AI agent" });
    }
  });

  app.get("/api/demo/sample-commands", async (req, res) => {
    try {
      const { getSampleCommands } = await import('./routes/demo');
      await getSampleCommands(req, res);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sample commands" });
    }
  });

  // DEBUG: Test usage processor directly
  app.post('/api/debug/process-usage', async (req, res) => {
    try {
      const { usageData } = req.body;
      if (!usageData) {
        return res.status(400).json({ error: 'No usage data provided' });
      }
      
      console.log('\n🔍 DEBUG: Starting direct usage processing test...');
      const { processUsageFile } = await import('./services/usage-processor');
      const result = await processUsageFile(usageData);
      
      console.log('\n🔍 DEBUG: Processing result:', result);
      
      // Get current state
      const representatives = await storage.getRepresentatives();
      const invoices = await storage.getInvoices();
      
      res.json({
        processResult: result,
        databaseState: {
          representatives: representatives.length,
          invoices: invoices.length,
          representativesList: representatives.map(r => ({
            storeName: r.storeName,
            panelUsername: r.panelUsername,
            totalDebt: r.totalDebt
          }))
        }
      });
    } catch (error) {
      console.error('DEBUG endpoint error:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // Enhanced Representatives routes (with pagination and performance testing)
  const representativesRoutes = await import('./routes/representatives');
  app.use("/api/representatives", representativesRoutes.default);
  
  // Mount reminder routes
  const reminderRoutes = await import('./routes/reminders');
  app.use("/api/reminders", reminderRoutes.default);
  
  // Invoice templates routes
  const invoiceTemplateRoutes = await import('./routes/invoice-templates');
  app.use("/api/invoice-templates", invoiceTemplateRoutes.default);
  
  // Direct Invoice Test Endpoint (bypassing AI agent for now)
  app.post("/api/test-agent-invoice", async (req, res) => {
    try {
      const { representativeName, chatId } = req.body;
      const repName = representativeName || 'daryamb';
      const targetChatId = chatId || '5120932743';
      
      console.log(`🎯 Direct invoice test for representative: ${repName} to chat: ${targetChatId}`);
      
      // Find the representative first
      const rep = await storage.getRepresentativeByStoreName(repName);
      if (!rep) {
        return res.status(404).json({ 
          error: `Representative '${repName}' not found`,
          available_reps: (await storage.getRepresentatives()).map(r => r.storeName)
        });
      }

      // Get their invoices
      const invoices = await storage.getInvoicesByRepresentative(rep.id);
      if (invoices.length === 0) {
        return res.status(404).json({ 
          error: `No invoices found for representative '${repName}'`
        });
      }

      // Get the latest invoice
      const latestInvoice = invoices[0];
      
      // Send via direct messaging service
      const { sendInvoiceMessage } = await import('./services/direct-telegram');
      const telegramResult = await sendInvoiceMessage(targetChatId, latestInvoice.id);
      
      res.json({
        success: true,
        representative: repName,
        invoice_id: latestInvoice.id,
        invoice_amount: latestInvoice.amount,
        telegram_sent: telegramResult.ok,
        telegram_result: telegramResult,
        test_message: `Invoice ${latestInvoice.id} for representative ${repName} sent via direct Telegram API`
      });
      
    } catch (error) {
      console.error('Direct invoice test error:', error);
      res.status(500).json({ 
        error: 'Direct invoice test failed', 
        details: error.message 
      });
    }
  });

  // Enhanced Settings API routes for the web interface
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      // Return complete settings for frontend (don't hide sensitive data for admin panel)
      res.json(settings || {
        geminiApiKey: '',
        telegramBotToken: '',
        adminChatId: '',
        invoiceTemplate: '',
        representativePortalTexts: ''
      });
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت تنظیمات" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSystemSettingsSchema.parse(req.body);
      const settings = await storage.updateSystemSettings(validatedData);
      
      // Reinitialize bot with new token if provided
      if (validatedData.telegramBotToken) {
        await initializeBot();
      }
      
      res.json(settings);
    } catch (error) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "داده‌های تنظیمات نامعتبر است" });
      } else {
        res.status(500).json({ message: "خطا در ذخیره تنظیمات" });
      }
    }
  });

  // Representative portal routes
  app.get("/api/representatives/by-username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const representative = await storage.getRepresentativeByPanelUsername(username);
      
      if (!representative) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      
      res.json(representative);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت اطلاعات نماینده" });
    }
  });

  // Get invoices for specific representative
  app.get("/api/representatives/:id/invoices", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const invoices = await storage.getInvoicesByRepresentative(representativeId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت فاکتورها" });
    }
  });

  // Get payments for specific representative
  app.get("/api/representatives/:id/payments", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByRepresentative(representativeId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "خطا در دریافت پرداخت‌ها" });
    }
  });

  // Clear financial data endpoint
  app.delete("/api/clear-financial-data", async (req, res) => {
    try {
      await storage.clearFinancialData();
      res.json({ message: "اطلاعات مالی با موفقیت پاکسازی شد" });
    } catch (error) {
      console.error('Error clearing financial data:', error);
      res.status(500).json({ message: "خطا در پاکسازی اطلاعات مالی" });
    }
  });

  // Clear all data endpoint
  app.delete("/api/clear-all-data", async (req, res) => {
    try {
      await storage.clearAllData();
      res.json({ message: "تمام اطلاعات با موفقیت پاکسازی شد" });
    } catch (error) {
      console.error('Error clearing all data:', error);
      res.status(500).json({ message: "خطا در پاکسازی اطلاعات" });
    }
  });

  // Data management routes
  app.post("/api/admin/clear-financial", async (req, res) => {
    try {
      await storage.clearFinancialData();
      res.json({ message: "اطلاعات مالی با موفقیت پاکسازی شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در پاکسازی اطلاعات مالی" });
    }
  });

  app.post("/api/admin/clear-all", async (req, res) => {
    try {
      await storage.clearAllData();
      res.json({ message: "تمام اطلاعات با موفقیت پاکسازی شد" });
    } catch (error) {
      res.status(500).json({ message: "خطا در پاکسازی تمام اطلاعات" });
    }
  });

  // Register telegram test routes
  registerTelegramTestRoutes(app);

  // Register new advanced feature routes (imported at top)
  const { default: creditManagementRouter } = await import('./routes/credit-management.js');
  const { default: cashFlowRouter } = await import('./routes/cash-flow.js');
  const { default: profitabilityRouter } = await import('./routes/profitability.js');
  const { default: bankReconciliationRouter } = await import('./routes/bank-reconciliation.js');
  const { default: securityRouter } = await import('./routes/security.js');
  
  app.use('/api/credit-management', creditManagementRouter);
  app.use('/api/cash-flow', cashFlowRouter);
  app.use('/api/profitability', profitabilityRouter);
  app.use('/api/bank-reconciliation', bankReconciliationRouter);
  app.use('/api/security', securityRouter);

  const httpServer = createServer(app);
  return httpServer;
}
