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
