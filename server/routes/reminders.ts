// Automated Payment Reminders API Routes
import { Router } from 'express';
import { db } from '../db';
import { reminderRules, messageTemplates, reminderLogs } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { reminderEngine } from '../services/reminderEngine';

const router = Router();

// Get all reminder rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await db.select().from(reminderRules).orderBy(desc(reminderRules.createdAt));
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching reminder rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reminder rules'
    });
  }
});

// Create new reminder rule
router.post('/rules', async (req, res) => {
  try {
    const { name, triggerConditions, schedulePattern, channels, templateId } = req.body;

    // Validate cron pattern
    if (!isValidCronPattern(schedulePattern)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cron pattern'
      });
    }

    // Validate channels
    const validChannels = ['telegram', 'sms', 'email'];
    if (!channels.every((channel: string) => validChannels.includes(channel))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid channel specified'
      });
    }

    const newRule = await reminderEngine.createReminderRule({
      name,
      triggerConditions,
      schedulePattern,
      channels,
      templateId
    });

    res.status(201).json({
      success: true,
      data: newRule
    });
  } catch (error) {
    console.error('Error creating reminder rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reminder rule'
    });
  }
});

// Update reminder rule
router.put('/rules/:id', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    const updates = req.body;

    await reminderEngine.updateReminderRule(ruleId, updates);

    res.json({
      success: true,
      message: 'Reminder rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating reminder rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update reminder rule'
    });
  }
});

// Delete (deactivate) reminder rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    await reminderEngine.deleteReminderRule(ruleId);

    res.json({
      success: true,
      message: 'Reminder rule deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete reminder rule'
    });
  }
});

// Get message templates
router.get('/templates', async (req, res) => {
  try {
    const { channel, language } = req.query;
    
    let query = db.select().from(messageTemplates);
    const conditions = [];

    if (channel) {
      conditions.push(eq(messageTemplates.channel, channel as string));
    }
    if (language) {
      conditions.push(eq(messageTemplates.language, language as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const templates = await query.orderBy(desc(messageTemplates.createdAt));

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// Create message template
router.post('/templates', async (req, res) => {
  try {
    const { name, language, channel, subject, content, variables } = req.body;

    const result = await db.insert(messageTemplates).values({
      name,
      language,
      channel,
      subject,
      content,
      variables
    }).returning();

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
});

// Get reminder logs with analytics
router.get('/logs', async (req, res) => {
  try {
    const { start, end, ruleId, channel, status } = req.query;
    
    let query = db.select().from(reminderLogs);
    const conditions = [];

    if (start && end) {
      conditions.push(
        and(
          gte(reminderLogs.sentAt, new Date(start as string)),
          lte(reminderLogs.sentAt, new Date(end as string))
        )
      );
    }

    if (ruleId) {
      conditions.push(eq(reminderLogs.ruleId, parseInt(ruleId as string)));
    }

    if (channel) {
      conditions.push(eq(reminderLogs.channel, channel as string));
    }

    if (status) {
      conditions.push(eq(reminderLogs.deliveryStatus, status as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query.orderBy(desc(reminderLogs.sentAt));

    // Calculate analytics
    const analytics = {
      totalSent: logs.length,
      successRate: logs.filter(l => l.deliveryStatus === 'sent').length / logs.length || 0,
      channelBreakdown: {} as Record<string, number>,
      responseRate: logs.filter(l => l.responseReceived).length / logs.length || 0
    };

    logs.forEach(log => {
      analytics.channelBreakdown[log.channel] = 
        (analytics.channelBreakdown[log.channel] || 0) + 1;
    });

    res.json({
      success: true,
      data: logs,
      analytics
    });
  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reminder logs'
    });
  }
});

// Get reminder analytics
router.get('/analytics', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }

    const analytics = await reminderEngine.getAnalytics({
      start: new Date(start as string),
      end: new Date(end as string)
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// Test reminder rule (dry run)
router.post('/rules/:id/test', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    
    // Get the rule
    const rules = await db.select().from(reminderRules).where(eq(reminderRules.id, ruleId));
    if (rules.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reminder rule not found'
      });
    }

    const rule = rules[0];
    
    // This would normally execute the rule but in test mode
    // For now, return what would happen
    res.json({
      success: true,
      message: 'Test completed',
      data: {
        ruleName: rule.name,
        wouldExecuteAt: new Date().toISOString(),
        estimatedRecipients: '5-10 representatives', // Placeholder
        channels: rule.channels,
        triggerConditions: rule.triggerConditions
      }
    });
  } catch (error) {
    console.error('Error testing reminder rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test reminder rule'
    });
  }
});

// Helper function to validate cron patterns
function isValidCronPattern(pattern: string): boolean {
  // Basic cron pattern validation
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(pattern);
}

export default router;