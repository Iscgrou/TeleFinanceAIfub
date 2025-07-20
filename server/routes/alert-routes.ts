/**
 * PHASE 5.2: Alert System API Routes
 * مسیرهای API سیستم هشدارهای خودکار
 */

import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { AlertEngineService } from '../services/alert-engine';
import { insertAlertRuleSchema, insertAlertHistorySchema } from '@shared/schema';

const router = express.Router();
const alertEngine = new AlertEngineService();

// Input validation schemas
const createRuleSchema = insertAlertRuleSchema.extend({
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte', 'contains', 'not_contains']),
    value: z.any(),
    weight: z.number().optional()
  })),
  actions: z.array(z.object({
    type: z.enum(['telegram', 'sms', 'email', 'in_app', 'webhook']),
    recipient: z.string().optional(),
    template: z.string().optional(),
    priority: z.number().min(1).max(5),
    delay: z.number().optional()
  }))
});

const updateRuleSchema = createRuleSchema.partial();

// ===== ALERT RULES ROUTES =====

/**
 * GET /api/alerts/rules
 * دریافت همه قوانین هشدار
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = await storage.getAlertRules();
    res.json({
      success: true,
      data: rules,
      total: rules.length
    });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت قوانین هشدار',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/alerts/rules/active
 * دریافت قوانین فعال هشدار
 */
router.get('/rules/active', async (req, res) => {
  try {
    const rules = await storage.getActiveAlertRules();
    res.json({
      success: true,
      data: rules,
      total: rules.length
    });
  } catch (error) {
    console.error('Error fetching active alert rules:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت قوانین فعال هشدار',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/alerts/rules/:id
 * دریافت یک قانون هشدار خاص
 */
router.get('/rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه قانون نامعتبر است'
      });
    }

    const rule = await storage.getAlertRuleById(id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'قانون هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت قانون هشدار',
      details: error.message
    });
  }
});

/**
 * POST /api/alerts/rules
 * ایجاد قانون جدید هشدار
 */
router.post('/rules', async (req, res) => {
  try {
    const validatedData = createRuleSchema.parse(req.body);
    
    const rule = await storage.createAlertRule({
      ...validatedData,
      createdBy: 'admin' // TODO: Get from session
    });

    res.status(201).json({
      success: true,
      message: 'قانون هشدار با موفقیت ایجاد شد',
      data: rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: error.errors
      });
    }

    console.error('Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ایجاد قانون هشدار',
      details: error.message
    });
  }
});

/**
 * PUT /api/alerts/rules/:id
 * ویرایش قانون هشدار
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه قانون نامعتبر است'
      });
    }

    const validatedData = updateRuleSchema.parse(req.body);
    
    const rule = await storage.updateAlertRule(id, validatedData);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'قانون هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'قانون هشدار با موفقیت ویرایش شد',
      data: rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های ورودی نامعتبر',
        details: error.errors
      });
    }

    console.error('Error updating alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ویرایش قانون هشدار',
      details: error.message
    });
  }
});

/**
 * DELETE /api/alerts/rules/:id
 * حذف قانون هشدار
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه قانون نامعتبر است'
      });
    }

    const success = await storage.deleteAlertRule(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'قانون هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'قانون هشدار با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف قانون هشدار',
      details: error.message
    });
  }
});

// ===== ALERT HISTORY ROUTES =====

/**
 * GET /api/alerts/history
 * دریافت تاریخچه هشدارها
 */
router.get('/history', async (req, res) => {
  try {
    const { limit, offset, status } = req.query;
    
    const params: any = {};
    if (limit) params.limit = parseInt(limit as string);
    if (offset) params.offset = parseInt(offset as string);
    if (status) params.status = status as string;

    const alerts = await storage.getAlertHistory(params);
    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت تاریخچه هشدارها',
      details: error.message
    });
  }
});

/**
 * GET /api/alerts/history/representative/:id
 * دریافت تاریخچه هشدارهای نماینده خاص
 */
router.get('/history/representative/:id', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.id);
    if (isNaN(representativeId)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده نامعتبر است'
      });
    }

    const alerts = await storage.getAlertHistoryForRepresentative(representativeId);
    res.json({
      success: true,
      data: alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Error fetching representative alerts:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت هشدارهای نماینده',
      details: error.message
    });
  }
});

/**
 * POST /api/alerts/acknowledge/:id
 * تأیید دیده شدن هشدار
 */
router.post('/acknowledge/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه هشدار نامعتبر است'
      });
    }

    const acknowledgedBy = req.body.acknowledgedBy || 'admin'; // TODO: Get from session
    const success = await storage.acknowledgeAlert(id, acknowledgedBy);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'هشدار با موفقیت تأیید شد'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تأیید هشدار',
      details: error.message
    });
  }
});

/**
 * POST /api/alerts/resolve/:id
 * حل هشدار
 */
router.post('/resolve/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه هشدار نامعتبر است'
      });
    }

    const resolvedBy = req.body.resolvedBy || 'admin'; // TODO: Get from session
    const success = await storage.updateAlertStatus(id, 'resolved', resolvedBy);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'هشدار با موفقیت حل شد'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حل هشدار',
      details: error.message
    });
  }
});

// ===== ALERT EVALUATION ROUTES =====

/**
 * POST /api/alerts/evaluate/:representativeId
 * ارزیابی قوانین هشدار برای نماینده خاص
 */
router.post('/evaluate/:representativeId', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.representativeId);
    if (isNaN(representativeId)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده نامعتبر است'
      });
    }

    const results = await alertEngine.evaluateRulesForRepresentative(representativeId);
    const triggeredRules = results.filter(r => r.triggered);

    res.json({
      success: true,
      message: 'ارزیابی قوانین هشدار تکمیل شد',
      data: {
        results,
        summary: {
          totalRules: results.length,
          triggeredRules: triggeredRules.length,
          representativeId
        }
      }
    });
  } catch (error) {
    console.error('Error evaluating alert rules:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ارزیابی قوانین هشدار',
      details: error.message
    });
  }
});

/**
 * POST /api/alerts/evaluate-all
 * ارزیابی قوانین هشدار برای همه نمایندگان
 */
router.post('/evaluate-all', async (req, res) => {
  try {
    const result = await alertEngine.evaluateAllRepresentatives();
    
    res.json({
      success: true,
      message: 'ارزیابی گروهی قوانین هشدار تکمیل شد',
      data: result
    });
  } catch (error) {
    console.error('Error evaluating all representatives:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در ارزیابی گروهی قوانین هشدار',
      details: error.message
    });
  }
});

// ===== NOTIFICATION ROUTES =====

/**
 * GET /api/alerts/notifications
 * دریافت لاگ اعلانات
 */
router.get('/notifications', async (req, res) => {
  try {
    const { alertId } = req.query;
    const notifications = await storage.getNotificationLogs(
      alertId ? parseInt(alertId as string) : undefined
    );
    
    res.json({
      success: true,
      data: notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت اعلانات',
      details: error.message
    });
  }
});

/**
 * GET /api/alerts/notifications/stats
 * دریافت آمار اعلانات
 */
router.get('/notifications/stats', async (req, res) => {
  try {
    const stats = await storage.getNotificationStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت آمار اعلانات',
      details: error.message
    });
  }
});

// ===== TEST ROUTES =====

/**
 * POST /api/alerts/test/:ruleId
 * تست قانون هشدار
 */
router.post('/test/:ruleId', async (req, res) => {
  try {
    const ruleId = parseInt(req.params.ruleId);
    if (isNaN(ruleId)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه قانون نامعتبر است'
      });
    }

    const { representativeId } = req.body;
    if (!representativeId) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده الزامی است'
      });
    }

    const results = await alertEngine.evaluateRulesForRepresentative(representativeId);
    const ruleResult = results.find(r => r.ruleId === ruleId);

    if (!ruleResult) {
      return res.status(404).json({
        success: false,
        error: 'قانون هشدار یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'تست قانون هشدار تکمیل شد',
      data: ruleResult
    });
  } catch (error) {
    console.error('Error testing alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تست قانون هشدار',
      details: error.message
    });
  }
});

export default router;