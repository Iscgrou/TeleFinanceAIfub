import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSystemSettingsSchema } from "@shared/schema";
import { initializeBot } from "./telegram/bot";

export async function registerRoutes(app: Express): Promise<Server> {
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
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives);
    } catch (error) {
      res.status(500).json({ message: "Error fetching representatives" });
    }
  });

  // Enhanced pagination endpoint for scalability
  app.get("/api/representatives/paginated", async (req, res) => {
    try {
      const {
        page = '1',
        limit = '20',
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeInactive = 'false'
      } = req.query;

      const params = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeInactive: includeInactive === 'true'
      };

      const result = await (storage as any).getRepresentativesPaginated(params);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.total,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
          limit: params.limit
        }
      });
    } catch (error) {
      console.error('Error in paginated representatives:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch paginated representatives'
      });
    }
  });

  // Performance optimization testing endpoint
  app.get("/api/representatives/performance-test", async (req, res) => {
    try {
      const startTime = performance.now();
      
      const tests = [
        { page: 1, limit: 10, label: "Small page (10)" },
        { page: 1, limit: 50, label: "Medium page (50)" },
        { page: 1, limit: 100, label: "Large page (100)" },
        { page: 2, limit: 50, label: "Second page" },
        { page: 1, limit: 20, search: "dar", label: "Search test" }
      ];
      
      const results = [];
      
      for (const test of tests) {
        const testStart = performance.now();
        const result = await (storage as any).getRepresentativesPaginated(test);
        const testEnd = performance.now();
        
        results.push({
          ...test,
          duration: parseFloat((testEnd - testStart).toFixed(2)),
          durationMs: `${(testEnd - testStart).toFixed(2)}ms`,
          recordCount: result.data.length,
          totalRecords: result.total
        });
      }
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      const optimal = results.sort((a, b) => a.duration - b.duration)[0];
      
      res.json({
        success: true,
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        tests: results,
        analysis: {
          fastest: optimal,
          averageDuration: `${(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(2)}ms`,
          recommendation: `Optimal: ${optimal.limit} records/page (${optimal.durationMs})`
        },
        systemStats: {
          totalRepresentatives: results[0]?.totalRecords || 0,
          pagesAt20: Math.ceil((results[0]?.totalRecords || 0) / 20),
          pagesAt50: Math.ceil((results[0]?.totalRecords || 0) / 50)
        }
      });
    } catch (error) {
      console.error('Performance test error:', error);
      res.status(500).json({
        success: false,
        error: 'Performance test failed'
      });
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

  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
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

  // Settings API routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      // Don't return sensitive data
      const sanitizedSettings = settings ? {
        speechToTextProvider: settings.speechToTextProvider,
        hasGeminiKey: !!settings.geminiApiKey,
        hasSpeechKey: !!settings.speechToTextApiKey,
        hasBotToken: !!settings.telegramBotToken
      } : null;
      res.json(sanitizedSettings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings" });
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
      
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
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

  // Initialize Telegram bot on startup
  setTimeout(async () => {
    try {
      await initializeBot();
    } catch (error) {
      console.error('Failed to initialize bot on startup:', error);
    }
  }, 1000);

  const httpServer = createServer(app);
  return httpServer;
}
