import { Express } from 'express';
import { storage } from '../storage';
import { sendInvoiceMessage, sendDirectMessage, checkBotStatus } from '../services/direct-telegram';

export function registerTelegramTestRoutes(app: Express): void {
  // Test endpoint to manually send invoice via Telegram API
  app.post('/api/test/telegram/send-invoice/:invoiceId', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      const chatId = req.body.chatId || '5120932743'; // Default to admin chat
      
      console.log(`Testing direct Telegram invoice send: Invoice ${invoiceId} to chat ${chatId}`);
      
      // Use direct messaging service (bypasses polling conflicts)
      const telegramResult = await sendInvoiceMessage(chatId, invoiceId);
      
      if (telegramResult.ok) {
        res.json({ 
          success: true, 
          message: 'Invoice sent successfully via direct Telegram API',
          invoice_id: invoiceId,
          telegram_result: telegramResult
        });
      } else {
        res.status(500).json({ 
          error: 'Direct Telegram API error', 
          details: telegramResult 
        });
      }
      
    } catch (error) {
      console.error('Error in Telegram test endpoint:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error.message 
      });
    }
  });
  
  // Test endpoint to check bot status using direct service
  app.get('/api/test/telegram/status', async (req, res) => {
    try {
      const botStatus = await checkBotStatus();
      
      // Check for polling conflicts separately
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      let pollingStatus = null;
      
      if (botToken) {
        try {
          const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=1`);
          pollingStatus = await updatesResponse.json();
        } catch (e) {
          pollingStatus = { error: e.message };
        }
      }
      
      res.json({
        bot_status: botStatus,
        polling_status: pollingStatus,
        direct_messaging_available: botStatus.ok,
        polling_conflict: pollingStatus && !pollingStatus.ok && pollingStatus.error_code === 409
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Test direct message sending
  app.post('/api/test/telegram/send-message', async (req, res) => {
    try {
      const { chatId, message } = req.body;
      
      if (!chatId || !message) {
        return res.status(400).json({ error: 'chatId and message are required' });
      }
      
      const result = await sendDirectMessage(chatId, message);
      
      if (result.ok) {
        res.json({ success: true, result });
      } else {
        res.status(500).json({ error: 'Failed to send message', details: result });
      }
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}