// Multi-Channel Notification Service
import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class NotificationService {
  private twilioClient: any;
  private isInitialized = false;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    try {
      // Initialize Twilio (SMS)
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (twilioSid && twilioToken) {
        this.twilioClient = twilio(twilioSid, twilioToken);
        console.log('✅ Twilio SMS service initialized');
      } else {
        console.log('ℹ️ Twilio credentials not configured - SMS service optional');
      }

      // Initialize SendGrid (Email)
      const sendGridKey = process.env.SENDGRID_API_KEY;
      if (sendGridKey) {
        sgMail.setApiKey(sendGridKey);
        console.log('✅ SendGrid email service initialized');
      } else {
        console.log('ℹ️ SendGrid API key not configured - Email service optional');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize notification services:', error);
    }
  }

  async sendTelegram(username: string, message: string): Promise<DeliveryResult> {
    try {
      // This will be handled by the existing Telegram bot
      // For now, we'll use a placeholder implementation
      const result = await this.sendViaTelegramBot(username, message);
      
      return {
        success: result.success,
        messageId: result.messageId,
        cost: 0 // Telegram is free
      };
    } catch (error) {
      console.error('❌ Telegram delivery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<DeliveryResult> {
    if (!this.twilioClient) {
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        cost: parseFloat(result.price || '0')
      };
    } catch (error) {
      console.error('❌ SMS delivery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendEmail(email: string, subject: string, content: string): Promise<DeliveryResult> {
    if (!process.env.SENDGRID_API_KEY) {
      return {
        success: false,
        error: 'SendGrid not configured'
      };
    }

    try {
      const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'noreply@financial-bot.com',
        subject,
        text: content,
        html: this.convertToHtml(content)
      };

      const result = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'],
        cost: 0.001 // Approximate SendGrid cost
      };
    } catch (error) {
      console.error('❌ Email delivery failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendViaTelegramBot(username: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    // This would integrate with the existing bot infrastructure
    // For now, returning a mock success response
    try {
      // TODO: Integrate with actual bot service
      console.log(`📤 Would send Telegram message to @${username}: ${message.substring(0, 50)}...`);
      return {
        success: true,
        messageId: `tg_${Date.now()}`
      };
    } catch (error) {
      return { success: false };
    }
  }

  private convertToHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  // Channel cost analysis
  async calculateChannelCosts(logs: any[]): Promise<Record<string, number>> {
    const costs = {
      telegram: 0,
      sms: 0,
      email: 0
    };

    logs.forEach(log => {
      switch (log.channel) {
        case 'telegram':
          costs.telegram += 0; // Free
          break;
        case 'sms':
          costs.sms += 0.05; // Approximate cost per SMS
          break;
        case 'email':
          costs.email += 0.001; // Approximate cost per email
          break;
      }
    });

    return costs;
  }

  // Optimal send time calculation
  async getOptimalSendTime(representativeId: number): Promise<Date> {
    // This would analyze historical response patterns
    // For now, return a default time (9 AM Tehran time)
    const optimal = new Date();
    optimal.setHours(9, 0, 0, 0);
    return optimal;
  }

  // Delivery rate optimization
  async getChannelPerformance(timeRange: { start: Date; end: Date }): Promise<Record<string, { deliveryRate: number; responseRate: number }>> {
    // This would analyze actual delivery and response data
    return {
      telegram: { deliveryRate: 0.95, responseRate: 0.25 },
      sms: { deliveryRate: 0.98, responseRate: 0.15 },
      email: { deliveryRate: 0.85, responseRate: 0.08 }
    };
  }
}