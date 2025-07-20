/**
 * PHASE 5.2: Alert Rule Engine
 * سیستم پردازش هوشمند قوانین هشدار
 */

import { storage } from '../storage';
import type { 
  AlertRule, 
  InsertAlertRule, 
  InsertAlertHistory, 
  Representative,
  AlertHistoryRecord 
} from '@shared/schema';
import { AIAnalyticsService } from './ai-analytics';

export interface AlertCondition {
  field: string; // e.g., 'currentDebt', 'riskLevel', 'daysSinceLastPayment'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'not_contains';
  value: any;
  weight?: number; // For weighted conditions
}

export interface AlertAction {
  type: 'telegram' | 'sms' | 'email' | 'in_app' | 'webhook';
  recipient?: string; // Optional override
  template?: string;
  priority: 1 | 2 | 3 | 4 | 5; // 5 = critical
  delay?: number; // Delay in minutes before sending
}

export interface AlertEvaluationResult {
  ruleId: number;
  representativeId: number;
  triggered: boolean;
  conditions: {
    condition: AlertCondition;
    matched: boolean;
    actualValue: any;
  }[];
  score: number; // Weighted score if using multiple conditions
  metadata?: Record<string, any>;
}

/**
 * موتور اصلی پردازش هشدارها
 */
export class AlertEngineService {
  private aiAnalytics: AIAnalyticsService;

  constructor() {
    this.aiAnalytics = new AIAnalyticsService();
  }

  /**
   * ارزیابی همه قوانین هشدار برای نماینده خاص
   */
  async evaluateRulesForRepresentative(representativeId: number): Promise<AlertEvaluationResult[]> {
    try {
      const representative = await storage.getRepresentativeById(representativeId);
      if (!representative) {
        throw new Error(`Representative with ID ${representativeId} not found`);
      }

      // دریافت همه قوانین فعال
      const activeRules = await storage.getActiveAlertRules();
      const results: AlertEvaluationResult[] = [];

      // دریافت تحلیل AI برای این نماینده (در صورت نیاز)
      let aiAnalysis;
      try {
        aiAnalysis = await this.aiAnalytics.analyzeDebtTrend(representativeId);
      } catch (error) {
        console.warn(`Failed to get AI analysis for representative ${representativeId}:`, error);
      }

      // ارزیابی هر قانون
      for (const rule of activeRules) {
        const result = await this.evaluateRule(rule, representative, aiAnalysis);
        results.push(result);

        // اگر قانون فعال شد، هشدار را ثبت و اقدامات را انجام دهیم
        if (result.triggered) {
          await this.triggerAlert(rule, representative, result);
        }
      }

      return results;
    } catch (error) {
      console.error('Error evaluating rules for representative:', error);
      throw error;
    }
  }

  /**
   * ارزیابی یک قانون هشدار برای یک نماینده
   */
  private async evaluateRule(
    rule: AlertRule, 
    representative: Representative, 
    aiAnalysis?: any
  ): Promise<AlertEvaluationResult> {
    try {
      const conditions = rule.conditions as AlertCondition[];
      const conditionResults: AlertEvaluationResult['conditions'] = [];
      let totalScore = 0;
      let totalWeight = 0;

      // ایجاد context داده برای ارزیابی
      const context = await this.buildEvaluationContext(representative, aiAnalysis);

      // ارزیابی هر شرط
      for (const condition of conditions) {
        const weight = condition.weight || 1;
        const actualValue = this.getValueFromContext(context, condition.field);
        const matched = this.evaluateCondition(condition, actualValue);

        conditionResults.push({
          condition,
          matched,
          actualValue
        });

        if (matched) {
          totalScore += weight;
        }
        totalWeight += weight;
      }

      // تعیین فعالسازی قانون (همه شرایط باید برقرار باشند)
      const triggered = conditionResults.every(result => result.matched);
      const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      return {
        ruleId: rule.id,
        representativeId: representative.id,
        triggered,
        conditions: conditionResults,
        score: normalizedScore,
        metadata: {
          ruleName: rule.name,
          evaluatedAt: new Date(),
          context: Object.keys(context)
        }
      };
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return {
        ruleId: rule.id,
        representativeId: representative.id,
        triggered: false,
        conditions: [],
        score: 0,
        metadata: { error: error.message }
      };
    }
  }

  /**
   * ایجاد context داده برای ارزیابی شرایط
   */
  private async buildEvaluationContext(representative: Representative, aiAnalysis?: any) {
    try {
      // داده‌های پایه نماینده
      const context: Record<string, any> = {
        id: representative.id,
        storeName: representative.storeName,
        currentDebt: parseFloat(representative.totalDebt?.toString() || '0'),
        creditLimit: parseFloat(representative.creditLimit?.toString() || '1000000'),
        riskLevel: representative.riskLevel,
        isActive: representative.isActive,
      };

      // محاسبه درصد استفاده از اعتبار
      context.creditUtilization = context.creditLimit > 0 
        ? (context.currentDebt / context.creditLimit) * 100 
        : 0;

      // اضافه کردن تحلیل AI
      if (aiAnalysis) {
        context.aiRiskLevel = aiAnalysis.riskLevel;
        context.debtTrend = aiAnalysis.debtTrend;
        context.trendPercentage = aiAnalysis.trendPercentage;
        context.predictedDebt30Days = aiAnalysis.predictedDebtIn30Days;
      }

      // دریافت آخرین فاکتور و پرداخت
      try {
        const recentInvoices = await storage.getInvoicesByRepresentative(representative.id);
        const recentPayments = await storage.getPaymentsByRepresentative(representative.id);

        if (recentInvoices.length > 0) {
          const lastInvoice = recentInvoices[recentInvoices.length - 1];
          context.daysSinceLastInvoice = Math.floor(
            (Date.now() - lastInvoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          context.lastInvoiceAmount = parseFloat(lastInvoice.amount.toString());
        }

        if (recentPayments.length > 0) {
          const lastPayment = recentPayments[recentPayments.length - 1];
          context.daysSinceLastPayment = Math.floor(
            (Date.now() - lastPayment.paymentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          context.lastPaymentAmount = parseFloat(lastPayment.amount.toString());
        } else {
          context.daysSinceLastPayment = 9999; // خیلی زیاد اگر هیچ پرداختی نداشته
        }

        // محاسبه آمار پرداخت
        context.totalPaid = recentPayments.reduce((sum, payment) => 
          sum + parseFloat(payment.amount.toString()), 0
        );
        context.paymentHistory = recentPayments.length;
      } catch (error) {
        console.warn('Error building payment context:', error);
      }

      return context;
    } catch (error) {
      console.error('Error building evaluation context:', error);
      return {};
    }
  }

  /**
   * دریافت مقدار از context بر اساس field path
   */
  private getValueFromContext(context: Record<string, any>, fieldPath: string): any {
    // پشتیبانی از nested fields مثل 'ai.riskLevel'
    const keys = fieldPath.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * ارزیابی یک شرط
   */
  private evaluateCondition(condition: AlertCondition, actualValue: any): boolean {
    try {
      const { operator, value: expectedValue } = condition;

      // Handle null/undefined values
      if (actualValue === null || actualValue === undefined) {
        return operator === 'eq' && expectedValue === null;
      }

      switch (operator) {
        case 'eq':
          return actualValue === expectedValue;
        
        case 'gt':
          return actualValue > expectedValue;
        
        case 'gte':
          return actualValue >= expectedValue;
        
        case 'lt':
          return actualValue < expectedValue;
        
        case 'lte':
          return actualValue <= expectedValue;
        
        case 'contains':
          return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        
        case 'not_contains':
          return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        
        default:
          console.warn(`Unknown operator: ${operator}`);
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * فعالسازی هشدار و اجرای اقدامات
   */
  private async triggerAlert(
    rule: AlertRule, 
    representative: Representative, 
    evaluationResult: AlertEvaluationResult
  ): Promise<void> {
    try {
      // ثبت هشدار در تاریخچه
      const alertData: InsertAlertHistory = {
        ruleId: rule.id,
        representativeId: representative.id,
        alertType: this.getAlertTypeFromRule(rule),
        severity: rule.priority || 1,
        title: this.generateAlertTitle(rule, representative),
        message: this.generateAlertMessage(rule, representative, evaluationResult),
        metadata: {
          evaluationResult,
          triggeredAt: new Date(),
          conditions: evaluationResult.conditions
        },
        status: 'pending'
      };

      const alert = await storage.createAlertHistory(alertData);

      // به‌روزرسانی آمار قانون
      await storage.updateAlertRuleTriggerCount(rule.id);

      // اجرای اقدامات تعریف شده
      const actions = rule.actions as AlertAction[];
      for (const action of actions) {
        await this.executeAction(action, alert, representative, rule);
      }

      console.log(`✅ Alert triggered: ${rule.name} for representative ${representative.storeName}`);
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * تعیین نوع هشدار بر اساس قانون
   */
  private getAlertTypeFromRule(rule: AlertRule): string {
    // تحلیل شرایط برای تعیین نوع هشدار
    const conditions = rule.conditions as AlertCondition[];
    
    if (conditions.some(c => c.field.includes('debt'))) {
      return 'debt_alert';
    }
    if (conditions.some(c => c.field.includes('risk'))) {
      return 'risk_alert';
    }
    if (conditions.some(c => c.field.includes('payment'))) {
      return 'payment_alert';
    }
    
    return 'general_alert';
  }

  /**
   * تولید عنوان هشدار
   */
  private generateAlertTitle(rule: AlertRule, representative: Representative): string {
    return `${rule.name} - ${representative.storeName}`;
  }

  /**
   * تولید پیام هشدار
   */
  private generateAlertMessage(
    rule: AlertRule, 
    representative: Representative, 
    evaluationResult: AlertEvaluationResult
  ): string {
    const conditions = evaluationResult.conditions
      .filter(c => c.matched)
      .map(c => `${c.condition.field}: ${c.actualValue}`)
      .join(', ');

    return `هشدار فعال شد برای نماینده ${representative.storeName}. شرایط: ${conditions}`;
  }

  /**
   * اجرای یک اقدام هشدار
   */
  private async executeAction(
    action: AlertAction, 
    alert: AlertHistoryRecord, 
    representative: Representative, 
    rule: AlertRule
  ): Promise<void> {
    try {
      // اگر تأخیر تعریف شده، پیام را به صف اضافه می‌کنیم
      if (action.delay && action.delay > 0) {
        // TODO: Implement delayed notification queue
        console.log(`Scheduling notification for ${action.delay} minutes`);
      }

      // تعیین گیرنده پیام
      const recipient = action.recipient || this.getDefaultRecipient(action.type, representative);
      
      // تولید محتوای پیام
      const content = this.generateNotificationContent(action, alert, representative, rule);

      // ثبت در لاگ اعلانات
      const notificationData = {
        alertId: alert.id,
        channel: action.type,
        recipient,
        subject: alert.title,
        content,
        status: 'pending' as const
      };

      const notification = await storage.createNotificationLog(notificationData);

      // ارسال بر اساس نوع کانال
      await this.sendNotification(action.type, recipient, content, notification.id);

    } catch (error) {
      console.error('Error executing action:', error);
    }
  }

  /**
   * تعیین گیرنده پیش‌فرض بر اساس نوع کانال
   */
  private getDefaultRecipient(channelType: string, representative: Representative): string {
    switch (channelType) {
      case 'telegram':
        return representative.telegramId || 'admin';
      case 'sms':
        return representative.phone || '';
      case 'email':
        return ''; // باید از تنظیمات سیستم دریافت شود
      case 'in_app':
        return representative.id.toString();
      default:
        return 'admin';
    }
  }

  /**
   * تولید محتوای اعلان
   */
  private generateNotificationContent(
    action: AlertAction, 
    alert: AlertHistoryRecord, 
    representative: Representative, 
    rule: AlertRule
  ): string {
    // اگر template مشخص شده، از آن استفاده می‌کنیم
    if (action.template) {
      return this.processTemplate(action.template, { alert, representative, rule });
    }

    // پیام پیش‌فرض
    return `🚨 هشدار: ${alert.title}\n\n${alert.message}\n\nزمان: ${alert.createdAt}`;
  }

  /**
   * پردازش template پیام
   */
  private processTemplate(
    template: string, 
    data: { alert: AlertHistoryRecord; representative: Representative; rule: AlertRule }
  ): string {
    let content = template;
    
    // Replace placeholders
    content = content.replace(/\{representative\.storeName\}/g, data.representative.storeName);
    content = content.replace(/\{representative\.totalDebt\}/g, data.representative.totalDebt?.toString() || '0');
    content = content.replace(/\{alert\.title\}/g, data.alert.title);
    content = content.replace(/\{alert\.message\}/g, data.alert.message);
    content = content.replace(/\{rule\.name\}/g, data.rule.name);
    
    return content;
  }

  /**
   * ارسال اعلان بر اساس نوع کانال
   */
  private async sendNotification(
    channelType: string, 
    recipient: string, 
    content: string, 
    notificationId: number
  ): Promise<void> {
    try {
      let success = false;
      let errorMessage = '';

      switch (channelType) {
        case 'telegram':
          // TODO: ادغام با سرویس تلگرام موجود
          console.log(`📱 Telegram notification to ${recipient}: ${content}`);
          success = true;
          break;

        case 'sms':
          // TODO: ادغام با سرویس SMS
          console.log(`📞 SMS notification to ${recipient}: ${content}`);
          success = true;
          break;

        case 'email':
          // TODO: ادغام با سرویس ایمیل
          console.log(`📧 Email notification to ${recipient}: ${content}`);
          success = true;
          break;

        case 'in_app':
          // TODO: ذخیره در سیستم پیام‌های داخلی
          console.log(`🔔 In-app notification for ${recipient}: ${content}`);
          success = true;
          break;

        default:
          errorMessage = `Unknown channel type: ${channelType}`;
      }

      // به‌روزرسانی وضعیت ارسال
      await storage.updateNotificationStatus(
        notificationId, 
        success ? 'sent' : 'failed', 
        errorMessage
      );

    } catch (error) {
      console.error('Error sending notification:', error);
      await storage.updateNotificationStatus(notificationId, 'failed', error.message);
    }
  }

  /**
   * ارزیابی دوره‌ای همه نمایندگان (برای cron job)
   */
  async evaluateAllRepresentatives(): Promise<{
    total: number;
    triggered: number;
    errors: number;
  }> {
    try {
      const representatives = await storage.getRepresentatives();
      let triggered = 0;
      let errors = 0;

      console.log(`🔍 Starting alert evaluation for ${representatives.length} representatives`);

      for (const representative of representatives) {
        try {
          const results = await this.evaluateRulesForRepresentative(representative.id);
          const triggeredRules = results.filter(r => r.triggered);
          triggered += triggeredRules.length;

          if (triggeredRules.length > 0) {
            console.log(`⚠️ ${triggeredRules.length} alerts triggered for ${representative.storeName}`);
          }
        } catch (error) {
          console.error(`Error evaluating representative ${representative.id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Alert evaluation complete: ${triggered} triggered, ${errors} errors`);

      return {
        total: representatives.length,
        triggered,
        errors
      };
    } catch (error) {
      console.error('Error in bulk alert evaluation:', error);
      throw error;
    }
  }
}