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
import { generateInvoiceImage } from "./services/svg-invoice-generator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware disabled - iOS Safari compatibility
  // WAF and aggressive security can cause 403 errors on Safari
  console.log('[Security] Security middleware disabled for iOS/Safari compatibility');
  
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
    } catch (error: any) {
      console.error('Invoice generation test error:', error);
      res.status(500).json({ error: 'Invoice generation failed', details: error?.message || 'Unknown error' });
    }
  });

  // Dashboard API routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // Settings API routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = await storage.createOrUpdateSystemSettings({
          geminiApiKey: "",
          speechToTextProvider: "google",
          speechToTextApiKey: "",
          telegramBotToken: "",
          adminChatId: "",
          invoiceTemplate: JSON.stringify({
            companyName: "شرکت خدمات پروکسی",
            companyAddress: "تهران، ایران",
            companyPhone: "021-12345678",
            logoUrl: "",
            primaryColor: "#3b82f6",
            secondaryColor: "#64748b",
            footerText: "با تشکر از همکاری شما",
            showQRCode: true
          }),
          representativePortalTexts: JSON.stringify({
            welcomeTitle: "پورتال نماینده",
            welcomeSubtitle: "مدیریت حساب و مشاهده وضعیت مالی",
            debtSectionTitle: "وضعیت بدهی",
            invoicesSectionTitle: "فاکتورهای اخیر",
            paymentsSectionTitle: "پرداخت‌های انجام شده",
            contactInfo: "برای سوال یا مشکل با ما تماس بگیرید",
            emergencyContact: "شماره تماس اضطراری: 021-12345678"
          })
        });
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Error fetching settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const updatedSettings = await storage.createOrUpdateSystemSettings(req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Representative profile API routes
  app.get("/api/representatives/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔍 Fetching stats for representative ID: ${id}`);
      
      // Get all invoices for this representative
      const invoices = await storage.getInvoicesByRepresentative(id);
      console.log(`📄 Found ${invoices.length} invoices`);
      
      const payments = await storage.getPaymentsByRepresentative(id);
      console.log(`💳 Found ${payments.length} payments`);
      
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const totalPayments = payments.length;
      
      const averageInvoiceAmount = totalInvoices > 0 
        ? invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) / totalInvoices 
        : 0;
      
      const lastPaymentDate = payments.length > 0 
        ? payments.sort((a, b) => (b.paymentDate ? new Date(b.paymentDate).getTime() : 0) - (a.paymentDate ? new Date(a.paymentDate).getTime() : 0))[0].paymentDate
        : null;
      
      // Simple credit rating based on payment history
      const paymentRatio = totalInvoices > 0 ? paidInvoices / totalInvoices : 1;
      let creditRating = 'fair';
      if (paymentRatio >= 0.9) creditRating = 'excellent';
      else if (paymentRatio >= 0.7) creditRating = 'good';
      else if (paymentRatio < 0.3) creditRating = 'poor';
      
      const statsData = {
        totalInvoices,
        paidInvoices,
        totalPayments,
        averageInvoiceAmount,
        lastPaymentDate: lastPaymentDate || null,
        creditRating
      };
      
      console.log(`📊 Stats calculated:`, statsData);
      
      res.json({
        data: statsData
      });
    } catch (error: any) {
      console.error('❌ Error fetching representative stats:', error);
      res.status(500).json({ message: "Error fetching representative stats", error: error?.message });
    }
  });

  // Sales colleague profile API routes
  app.get("/api/sales-colleagues/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get all representatives assigned to this colleague
      const representatives = await storage.getRepresentativesByColleagueId(id);
      const totalRepresentatives = representatives.length;
      
      // Get commission records for this colleague
      const commissions = await storage.getCommissionsByColleague(id);
      const totalCommissions = commissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);
      
      // Calculate this month's commissions
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthCommissions = commissions
        .filter(comm => comm.createdAt && new Date(comm.createdAt) >= thisMonth)
        .reduce((sum, comm) => sum + parseFloat(comm.commissionAmount), 0);
      
      const averageCommissionPerRep = totalRepresentatives > 0 ? totalCommissions / totalRepresentatives : 0;
      
      // Find top representative by debt
      const topRepresentative = representatives.length > 0 
        ? representatives.reduce((top, rep) => 
            parseFloat(rep.totalDebt || '0') > parseFloat(top.totalDebt || '0') ? rep : top
          )
        : null;
      
      res.json({
        data: {
          totalRepresentatives,
          totalCommissions,
          thisMonthCommissions,
          averageCommissionPerRep,
          topRepresentative: topRepresentative ? {
            name: topRepresentative.storeName || '',
            totalDebt: parseFloat(topRepresentative.totalDebt || '0')
          } : null,
          recentActivity: [] // Can be expanded later
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching colleague stats" });
    }
  });

  app.get("/api/sales-colleagues/:id/representatives", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const representatives = await storage.getRepresentativesByColleagueId(id);
      res.json({ data: representatives });
    } catch (error) {
      res.status(500).json({ message: "Error fetching colleague representatives" });
    }
  });

  app.get("/api/sales-colleagues/:id/commissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const commissions = await storage.getCommissionsByColleague(id);
      
      // Sort by creation date descending and limit
      const sortedCommissions = commissions
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, limit);
      
      res.json({ data: sortedCommissions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching colleague commissions" });
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  // Increase representative debt
  app.post("/api/representatives/:id/increase-debt", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const { amount, description } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "مبلغ نامعتبر است" });
      }
      
      // Get current representative
      const rep = await storage.getRepresentativeById(representativeId);
      if (!rep) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      
      // Calculate new debt
      const currentDebt = parseFloat(rep.totalDebt || '0');
      const increaseAmount = parseFloat(amount);
      const newDebt = currentDebt + increaseAmount;
      
      // Update debt
      await storage.updateRepresentativeDebt(representativeId, newDebt.toString());
      
      // TODO: Add to ledger for tracking
      
      res.json({ success: true, newDebt: newDebt.toString() });
    } catch (error) {
      console.error('Error increasing debt:', error);
      res.status(500).json({ message: "خطا در افزایش بدهی" });
    }
  });

  // Decrease representative debt
  app.post("/api/representatives/:id/decrease-debt", async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const { amount, description } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "مبلغ نامعتبر است" });
      }
      
      // Get current representative
      const rep = await storage.getRepresentativeById(representativeId);
      if (!rep) {
        return res.status(404).json({ message: "نماینده یافت نشد" });
      }
      
      // Calculate new debt
      const currentDebt = parseFloat(rep.totalDebt || '0');
      const decreaseAmount = parseFloat(amount);
      const newDebt = Math.max(0, currentDebt - decreaseAmount); // Ensure debt doesn't go negative
      
      // Update debt
      await storage.updateRepresentativeDebt(representativeId, newDebt.toString());
      
      // TODO: Add to ledger for tracking
      
      res.json({ success: true, newDebt: newDebt.toString() });
    } catch (error) {
      console.error('Error decreasing debt:', error);
      res.status(500).json({ message: "خطا در کاهش بدهی" });
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
      let lineItems: any[] = [];
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
    } catch (error: any) {
      res.status(500).json({ message: "خطا در دریافت جزئیات فاکتور" });
    }
  });



  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  // Create new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      console.log('Create invoice request body:', req.body);
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "داده‌های فاکتور نامعتبر است",
          errors: error.errors // Include specific validation errors
        });
      } else {
        res.status(500).json({ 
          message: "خطا در ایجاد فاکتور",
          error: error.message 
        });
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
    } catch (error: any) {
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
    } catch (error: any) {
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
      console.log('\n🔍 DEBUG: Usage data type:', typeof usageData, Array.isArray(usageData));
      
      const { processUsageFile } = await import('./services/usage-processor');
      // Pass usageData directly (can be array or object)
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
    } catch (error: any) {
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
      
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(500).json({ message: "خطا در دریافت تنظیمات" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSystemSettingsSchema.parse(req.body);
      const settings = await storage.updateSystemSettings(validatedData);
      
      // Note: Bot reinitialization handled by bot service
      console.log('Settings updated - bot will restart automatically');
      
      res.json(settings);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
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

  // Telegram test routes removed for clean integration

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
  
  // Phase 5.1 - AI Analytics Routes
  const { default: aiAnalyticsRouter } = await import('./routes/ai-analytics.js');
  app.use('/api/ai-analytics', aiAnalyticsRouter);

  // Phase 5.2 - Alert System Routes
  const { default: alertRouter } = await import('./routes/alert-routes.js');
  app.use('/api/alerts', alertRouter);

  const httpServer = createServer(app);
  // Representative Messages API Routes
  app.post('/api/representatives/:id/messages', async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const messageData = {
        representativeId,
        ...req.body
      };
      
      const message = await storage.sendMessageToRepresentative(messageData);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ message: "خطا در ارسال پیام", error: error?.message });
    }
  });

  app.get('/api/representatives/:id/messages', async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const messages = await storage.getRepresentativeMessages(representativeId);
      res.json({ data: messages });
    } catch (error: any) {
      res.status(500).json({ message: "خطا در دریافت پیام‌ها", error: error?.message });
    }
  });

  app.post('/api/messages/:id/read', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ message: "خطا در علامت‌گذاری پیام", error: error?.message });
    }
  });

  app.get('/api/representatives/:id/unread-messages-count', async (req, res) => {
    try {
      const representativeId = parseInt(req.params.id);
      const count = await storage.getUnreadMessagesCount(representativeId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: "خطا در شمارش پیام‌ها", error: error?.message });
    }
  });

  // Enhanced Invoice Details API Routes
  app.post('/api/invoices/:id/details', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const persianDateInfo = storage.generatePersianDate(new Date());
      
      const detailData = {
        invoiceId,
        ...persianDateInfo,
        ...req.body
      };
      
      const detail = await storage.createInvoiceDetail(detailData);
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ message: "خطا در ایجاد جزئیات فاکتور", error: error?.message });
    }
  });

  app.get('/api/invoices/:id/details', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const details = await storage.getInvoiceDetails(invoiceId);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: "خطا در دریافت جزئیات فاکتور", error: error?.message });
    }
  });

  // Invoice History API Routes (مرحله 5.3)
  app.get('/api/invoices/history', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
      const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
      const representative = req.query.representative as string;
      const status = req.query.status as string;
      const search = req.query.search as string;

      console.log('[Invoice History] Query params:', { page, limit, dateFrom, dateTo, status, search });

      const result = await storage.getInvoiceHistory({
        page,
        limit,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        representative,
        status: status as 'paid' | 'unpaid' | 'all',
        search
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error fetching invoice history:", error);
      res.status(500).json({ error: "Failed to fetch invoice history" });
    }
  });

  app.get('/api/invoices/stats', async (req, res) => {
    try {
      const stats = await storage.getInvoiceStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching invoice stats:", error);
      res.status(500).json({ error: "Failed to fetch invoice stats" });
    }
  });

  app.get('/api/invoices/export', async (req, res) => {
    try {
      const ids = req.query.ids as string;
      const format = req.query.format as string;
      
      if (!ids) {
        return res.status(400).json({ error: "No invoice IDs provided" });
      }

      const invoiceIds = ids.split(',').map(id => parseInt(id));
      const result = await storage.exportInvoices(invoiceIds, format as 'excel' | 'pdf');

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.xlsx"');
      } else {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoices.pdf"');
      }

      res.send(result);
    } catch (error: any) {
      console.error("Error exporting invoices:", error);
      res.status(500).json({ error: "Failed to export invoices" });
    }
  });

  // Invoice Template Settings API Routes (مرحله 5.2)
  app.get('/api/settings/invoice-template', async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      let invoiceTemplate;
      
      if (settings?.invoiceTemplate) {
        try {
          // Try to parse if it's a JSON string
          invoiceTemplate = typeof settings.invoiceTemplate === 'string' 
            ? JSON.parse(settings.invoiceTemplate) 
            : settings.invoiceTemplate;
        } catch (parseError) {
          console.error("Error parsing invoice template:", parseError);
          invoiceTemplate = {
            companyName: 'شرکت نمونه',
            companyAddress: 'آدرس شرکت',
            companyPhone: '021-12345678',
            logoUrl: '',
            primaryColor: '#2563eb',
            secondaryColor: '#f3f4f6',
            fontFamily: 'iranYekan'
          };
        }
      } else {
        invoiceTemplate = {
          companyName: 'شرکت نمونه',
          companyAddress: 'آدرس شرکت',
          companyPhone: '021-12345678',
          logoUrl: '',
          primaryColor: '#2563eb',
          secondaryColor: '#f3f4f6',
          fontFamily: 'iranYekan'
        };
      }
      
      res.json({ invoiceTemplate });
    } catch (error: any) {
      console.error("Error fetching invoice template:", error);
      res.status(500).json({ error: "Failed to fetch invoice template" });
    }
  });

  app.post('/api/settings/invoice-template', async (req, res) => {
    try {
      const { invoiceTemplate } = req.body;
      const currentSettings = await storage.getSystemSettings();
      const updatedSettings = {
        ...currentSettings,
        invoiceTemplate: JSON.stringify(invoiceTemplate)
      };
      const settings = await storage.updateSystemSettings(updatedSettings);
      res.json({ success: true, invoiceTemplate: settings.invoiceTemplate });
    } catch (error: any) {
      console.error("Error saving invoice template:", error);
      res.status(500).json({ error: "Failed to save invoice template" });
    }
  });

  // Invoice Preview API Route (مرحله 5.3)
  app.post('/api/invoices/:id/preview', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "فاکتور یافت نشد" });
      }

      const settings = await storage.getSystemSettings();
      let template = null;
      
      if (settings?.invoiceTemplate) {
        try {
          template = typeof settings.invoiceTemplate === 'string' 
            ? JSON.parse(settings.invoiceTemplate) 
            : settings.invoiceTemplate;
        } catch (parseError) {
          console.error("Error parsing template for preview:", parseError);
          template = null;
        }
      }
      
      // Generate preview with template
      const pngBuffer = await storage.generateInvoicePNG(invoice, template);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="invoice-${invoiceId}-preview.png"`
      });
      res.send(pngBuffer);
    } catch (error: any) {
      console.error("Error generating invoice preview:", error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // Telegram API Routes  
  app.post('/api/telegram/restart-bot', async (req, res) => {
    try {
      const { initializeBot } = await import('./telegram/bot');
      await initializeBot();
      res.json({ success: true, message: 'Telegram bot restarted successfully' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to restart bot', 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/telegram/send-message', async (req, res) => {
    try {
      const { chatId, message } = req.body;
      const { sendMessage } = await import('./telegram/bot');
      await sendMessage(chatId, message);
      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send message', 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/telegram/status', async (req, res) => {
    try {
      const { getBot } = await import('./telegram/bot');
      const bot = getBot();
      res.json({ 
        success: true, 
        status: bot ? 'active' : 'inactive',
        message: bot ? 'Bot is running' : 'Bot is not initialized'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to check bot status', 
        error: (error as Error).message 
      });
    }
  });

  // Debug System API Routes
  app.post('/api/debug/test-block', async (req, res) => {
    try {
      const { blockId } = req.body;
      const { debugEngine } = await import('./services/debugEngine');
      const result = await debugEngine.testBlock(blockId);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test block', 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/debug/test-all', async (req, res) => {
    try {
      const { debugEngine } = await import('./services/debugEngine');
      const results = await debugEngine.runFullTest();
      const summary = debugEngine.generateSummaryReport();
      
      // ذخیره گزارش
      const reportPath = await debugEngine.saveReport(`debug-report-${Date.now()}.json`);
      
      res.json({ 
        success: true, 
        summary,
        totalResults: results.size,
        reportPath
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to run full test', 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/debug/report', async (req, res) => {
    try {
      const { debugEngine } = await import('./services/debugEngine');
      const summary = debugEngine.generateSummaryReport();
      res.json({ success: true, summary });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate report', 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/debug/sync-test', async (req, res) => {
    try {
      const { debugEngine } = await import('./services/debugEngine');
      const result = await debugEngine.testBotWebAppSync();
      res.json({ success: true, syncTest: result });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test sync', 
        error: (error as Error).message 
      });
    }
  });

  return httpServer;
}
