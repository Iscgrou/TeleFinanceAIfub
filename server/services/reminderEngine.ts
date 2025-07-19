// Automated Payment Reminder Engine
import cron from 'node-cron';
import { db } from '../db';
import { reminderRules, reminderLogs, messageTemplates, representatives } from '@shared/schema';
import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { NotificationService } from './notificationService';

export interface TriggerConditions {
  debtAmountMin?: number;
  debtAmountMax?: number;
  daysOverdue?: number;
  lastPaymentDays?: number;
  riskScore?: number;
}

export interface ReminderContext {
  representativeName: string;
  storeName: string;
  debtAmount: string;
  daysOverdue: number;
  panelUsername: string;
}

export class ReminderEngine {
  private notificationService: NotificationService;
  private scheduledJobs: Map<number, cron.ScheduledTask> = new Map();

  constructor() {
    this.notificationService = new NotificationService();
    this.initializeEngine();
  }

  private async initializeEngine() {
    console.log('🔄 Initializing Payment Reminder Engine...');
    
    try {
      // Load all active reminder rules
      const activeRules = await db
        .select()
        .from(reminderRules)
        .where(eq(reminderRules.isActive, true));

      console.log(`📋 Loading ${activeRules.length} active reminder rules`);

      // Schedule each rule
      for (const rule of activeRules) {
        await this.scheduleRule(rule);
      }

      console.log('✅ Payment Reminder Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Reminder Engine:', error);
    }
  }

  private async scheduleRule(rule: any) {
    try {
      // Parse cron pattern
      const cronPattern = rule.schedulePattern;
      
      // Create scheduled task
      const task = cron.schedule(cronPattern, async () => {
        await this.executeRule(rule);
      }, {
        scheduled: true,
        timezone: "Asia/Tehran"
      });

      this.scheduledJobs.set(rule.id, task);
      console.log(`⏰ Scheduled rule "${rule.name}" with pattern: ${cronPattern}`);
    } catch (error) {
      console.error(`❌ Failed to schedule rule ${rule.name}:`, error);
    }
  }

  private async executeRule(rule: any) {
    const startTime = performance.now();
    console.log(`🎯 Executing reminder rule: ${rule.name}`);

    try {
      // Parse trigger conditions
      const conditions: TriggerConditions = rule.triggerConditions;
      
      // Find representatives matching conditions
      const eligibleReps = await this.findEligibleRepresentatives(conditions);
      
      console.log(`📊 Found ${eligibleReps.length} eligible representatives for rule: ${rule.name}`);

      // Process each representative
      let successCount = 0;
      let failureCount = 0;

      for (const rep of eligibleReps) {
        try {
          // Check if already reminded recently (avoid spam)
          const recentReminder = await this.checkRecentReminder(rep.id, rule.id);
          if (recentReminder) {
            console.log(`⏭️ Skipping ${rep.storeName} - reminded recently`);
            continue;
          }

          // Send reminders via all configured channels
          const context: ReminderContext = {
            representativeName: rep.ownerName || rep.storeName,
            storeName: rep.storeName,
            debtAmount: rep.totalDebt,
            daysOverdue: this.calculateDaysOverdue(rep.createdAt),
            panelUsername: rep.panelUsername || 'N/A'
          };

          await this.sendMultiChannelReminder(rule, rep, context);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to send reminder to ${rep.storeName}:`, error);
          failureCount++;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`✅ Rule "${rule.name}" completed in ${duration.toFixed(2)}ms`);
      console.log(`📈 Results: ${successCount} sent, ${failureCount} failed`);

    } catch (error) {
      console.error(`❌ Rule execution failed for "${rule.name}":`, error);
    }
  }

  private async findEligibleRepresentatives(conditions: TriggerConditions) {
    let query = db.select().from(representatives);
    const whereConditions: any[] = [eq(representatives.isActive, true)];

    // Apply debt amount filters
    if (conditions.debtAmountMin !== undefined) {
      whereConditions.push(`CAST(${representatives.totalDebt} AS DECIMAL) >= ${conditions.debtAmountMin}`);
    }
    if (conditions.debtAmountMax !== undefined) {
      whereConditions.push(`CAST(${representatives.totalDebt} AS DECIMAL) <= ${conditions.debtAmountMax}`);
    }

    // Apply days overdue filter
    if (conditions.daysOverdue !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - conditions.daysOverdue);
      whereConditions.push(lt(representatives.createdAt, cutoffDate));
    }

    if (whereConditions.length > 1) {
      query = query.where(and(...whereConditions));
    } else if (whereConditions.length === 1) {
      query = query.where(whereConditions[0]);
    }

    return await query;
  }

  private async checkRecentReminder(repId: number, ruleId: number): Promise<boolean> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentLog = await db
      .select()
      .from(reminderLogs)
      .where(
        and(
          eq(reminderLogs.representativeId, repId),
          eq(reminderLogs.ruleId, ruleId),
          lt(reminderLogs.sentAt, twentyFourHoursAgo)
        )
      )
      .limit(1);

    return recentLog.length > 0;
  }

  private async sendMultiChannelReminder(rule: any, representative: any, context: ReminderContext) {
    const channels = rule.channels;

    // Get message template
    const template = rule.templateId ? 
      await this.getMessageTemplate(rule.templateId) : 
      await this.getDefaultTemplate(channels[0]);

    if (!template) {
      throw new Error(`No template found for rule ${rule.name}`);
    }

    // Render message content
    const messageContent = this.renderTemplate(template.content, context);

    // Send via each channel
    for (const channel of channels) {
      try {
        let deliveryResult;
        
        switch (channel) {
          case 'telegram':
            deliveryResult = await this.notificationService.sendTelegram(
              representative.panelUsername,
              messageContent
            );
            break;
          case 'sms':
            if (representative.phoneNumber) {
              deliveryResult = await this.notificationService.sendSMS(
                representative.phoneNumber,
                messageContent
              );
            } else {
              console.warn(`⚠️ No phone number for ${representative.storeName}`);
              continue;
            }
            break;
          case 'email':
            if (representative.email) {
              deliveryResult = await this.notificationService.sendEmail(
                representative.email,
                template.subject || 'Payment Reminder',
                messageContent
              );
            } else {
              console.warn(`⚠️ No email for ${representative.storeName}`);
              continue;
            }
            break;
          default:
            console.warn(`⚠️ Unsupported channel: ${channel}`);
            continue;
        }

        // Log the reminder
        await this.logReminder({
          representativeId: representative.id,
          ruleId: rule.id,
          channel,
          messageContent,
          deliveryStatus: deliveryResult?.success ? 'sent' : 'failed'
        });

        console.log(`📤 Sent ${channel} reminder to ${representative.storeName}`);

      } catch (error) {
        console.error(`❌ Failed to send ${channel} reminder to ${representative.storeName}:`, error);
        
        // Log failed attempt
        await this.logReminder({
          representativeId: representative.id,
          ruleId: rule.id,
          channel,
          messageContent,
          deliveryStatus: 'failed'
        });
      }
    }
  }

  private async getMessageTemplate(templateId: number) {
    const templates = await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.id, templateId))
      .limit(1);
    
    return templates[0];
  }

  private async getDefaultTemplate(channel: string) {
    const templates = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.channel, channel),
          eq(messageTemplates.language, 'fa')
        )
      )
      .limit(1);
    
    return templates[0];
  }

  private renderTemplate(template: string, context: ReminderContext): string {
    return template
      .replace(/\{\{representativeName\}\}/g, context.representativeName)
      .replace(/\{\{storeName\}\}/g, context.storeName)
      .replace(/\{\{debtAmount\}\}/g, context.debtAmount)
      .replace(/\{\{daysOverdue\}\}/g, context.daysOverdue.toString())
      .replace(/\{\{panelUsername\}\}/g, context.panelUsername);
  }

  private calculateDaysOverdue(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async logReminder(logData: {
    representativeId: number;
    ruleId: number;
    channel: string;
    messageContent: string;
    deliveryStatus: string;
  }) {
    try {
      await db.insert(reminderLogs).values({
        representativeId: logData.representativeId,
        ruleId: logData.ruleId,
        channel: logData.channel,
        messageContent: logData.messageContent,
        deliveryStatus: logData.deliveryStatus,
        responseReceived: false
      });
    } catch (error) {
      console.error('❌ Failed to log reminder:', error);
    }
  }

  // Public API methods
  async createReminderRule(ruleData: {
    name: string;
    triggerConditions: TriggerConditions;
    schedulePattern: string;
    channels: string[];
    templateId?: number;
  }) {
    try {
      const result = await db.insert(reminderRules).values({
        name: ruleData.name,
        triggerConditions: ruleData.triggerConditions as any,
        schedulePattern: ruleData.schedulePattern,
        channels: ruleData.channels,
        templateId: ruleData.templateId,
        isActive: true
      }).returning();

      const newRule = result[0];
      await this.scheduleRule(newRule);
      
      console.log(`✅ Created and scheduled new reminder rule: ${newRule.name}`);
      return newRule;
    } catch (error) {
      console.error('❌ Failed to create reminder rule:', error);
      throw error;
    }
  }

  async updateReminderRule(ruleId: number, updates: any) {
    try {
      // Update database
      await db
        .update(reminderRules)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(reminderRules.id, ruleId));

      // Stop old scheduled job
      const oldJob = this.scheduledJobs.get(ruleId);
      if (oldJob) {
        oldJob.stop();
        this.scheduledJobs.delete(ruleId);
      }

      // Reschedule with new settings
      const updatedRule = await db
        .select()
        .from(reminderRules)
        .where(eq(reminderRules.id, ruleId))
        .limit(1);

      if (updatedRule[0] && updatedRule[0].isActive) {
        await this.scheduleRule(updatedRule[0]);
      }

      console.log(`✅ Updated reminder rule ID: ${ruleId}`);
    } catch (error) {
      console.error('❌ Failed to update reminder rule:', error);
      throw error;
    }
  }

  async deleteReminderRule(ruleId: number) {
    try {
      // Stop scheduled job
      const job = this.scheduledJobs.get(ruleId);
      if (job) {
        job.stop();
        this.scheduledJobs.delete(ruleId);
      }

      // Soft delete - just deactivate
      await db
        .update(reminderRules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(reminderRules.id, ruleId));

      console.log(`✅ Deactivated reminder rule ID: ${ruleId}`);
    } catch (error) {
      console.error('❌ Failed to delete reminder rule:', error);
      throw error;
    }
  }

  async getAnalytics(timeRange: { start: Date; end: Date }) {
    try {
      const logs = await db
        .select()
        .from(reminderLogs)
        .where(
          and(
            lt(reminderLogs.sentAt, timeRange.end),
            lt(timeRange.start, reminderLogs.sentAt)
          )
        );

      const analytics = {
        totalSent: logs.length,
        successRate: logs.filter(l => l.deliveryStatus === 'sent').length / logs.length,
        channelBreakdown: {} as Record<string, number>,
        responseRate: logs.filter(l => l.responseReceived).length / logs.length,
        averageDeliveryTime: 0 // TODO: Implement delivery time tracking
      };

      // Calculate channel breakdown
      logs.forEach(log => {
        analytics.channelBreakdown[log.channel] = 
          (analytics.channelBreakdown[log.channel] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reminderEngine = new ReminderEngine();