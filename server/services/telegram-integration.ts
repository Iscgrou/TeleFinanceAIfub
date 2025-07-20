import { getBot } from '../telegram/bot';
import { storage } from '../storage';
import { CreditManagementService } from './credit-management';
import { CashFlowForecastingService } from './cash-flow-forecasting';
import { ProfitabilityAnalysisService } from './profitability-analysis';
import { BankReconciliationService } from './bank-reconciliation';

/**
 * Telegram Bot Integration for Advanced Financial Features
 * Extends the existing bot with new enterprise features
 */
export class TelegramIntegration {

  /**
   * Initialize advanced feature commands for Telegram bot
   */
  static initializeAdvancedCommands() {
    // Credit Management Commands
    const bot = getBot();
    if (!bot) {
      console.log('Telegram bot not available for advanced commands');
      return;
    }

    bot.onText(/\/credit_report/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const report = await CreditManagementService.generateCreditReport();
        const message = this.formatCreditReport(report);
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در تولید گزارش اعتباری');
      }
    });

    bot.onText(/\/check_credit (\w+) (\d+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const [, username, amount] = match;
      try {
        const rep = await storage.getRepresentativeByUsername(username);
        if (!rep) {
          await bot.sendMessage(chatId, '❌ نماینده یافت نشد');
          return;
        }
        
        const result = await CreditManagementService.checkCreditAvailability(rep.id, parseFloat(amount));
        const message = result.approved 
          ? `✅ اعتبار تأیید شد\n💰 مبلغ: ${amount.toLocaleString('fa-IR')} تومان\n📊 ${result.message}`
          : `❌ اعتبار رد شد\n📊 ${result.message}`;
        
        await bot.sendMessage(chatId, message);
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در بررسی اعتبار');
      }
    });

    // Cash Flow Commands
    bot.onText(/\/cashflow_forecast (\d+)?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const days = match[1] ? parseInt(match[1]) : 30;
      try {
        const forecast = await CashFlowForecastingService.generateForecast(days);
        const message = this.formatCashFlowForecast(forecast);
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در پیش‌بینی جریان نقدی');
      }
    });

    bot.onText(/\/cashflow_health/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const trends = await CashFlowForecastingService.analyzeTrends();
        const health = trends.averagePaymentDelay < 30 && trends.collectionRate > 80 ? 'سالم' : 'نیاز به توجه';
        const message = `💊 وضعیت جریان نقدی: ${health}\n📈 نرخ وصولی: ${trends.collectionRate.toFixed(1)}%\n⏱️ میانگین تأخیر: ${trends.averagePaymentDelay} روز`;
        await bot.sendMessage(chatId, message);
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در بررسی سلامت جریان نقدی');
      }
    });

    // Profitability Commands
    bot.onText(/\/profit_analysis/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const analysis = await ProfitabilityAnalysisService.generateReport('representative', 30);
        const message = this.formatProfitabilityReport(analysis);
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در تحلیل سودآوری');
      }
    });

    bot.onText(/\/top_performers (\d+)?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const count = match[1] ? parseInt(match[1]) : 5;
      try {
        const analysis = await ProfitabilityAnalysisService.generateReport('representative', 30);
        const message = this.formatTopPerformers(analysis.topPerformers.slice(0, count));
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در تولید لیست برترین‌ها');
      }
    });

    // Bank Reconciliation Commands
    bot.onText(/\/reconcile_status/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const status = await BankReconciliationService.getReconciliationStatus();
        const message = this.formatReconciliationStatus(status);
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در دریافت وضعیت تطبیق');
      }
    });

    // Combined Advanced Report
    bot.onText(/\/advanced_report/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        await bot.sendMessage(chatId, '📊 در حال تولید گزارش جامع...');
        
        const [creditReport, cashflowForecast, profitAnalysis, reconcileStatus] = await Promise.all([
          CreditManagementService.generateCreditReport(),
          CashFlowForecastingService.generateForecast(30),
          ProfitabilityAnalysisService.generateReport('representative', 30),
          BankReconciliationService.getReconciliationStatus()
        ]);

        const message = this.formatAdvancedReport({
          credit: creditReport,
          cashflow: cashflowForecast,
          profitability: profitAnalysis,
          reconciliation: reconcileStatus
        });

        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, '❌ خطا در تولید گزارش جامع');
      }
    });

    // Help command for new features
    bot.onText(/\/advanced_help/, async (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🚀 <b>دستورات پیشرفته مدیریت مالی</b>

<b>🏦 مدیریت اعتباری:</b>
/credit_report - گزارش کلی اعتبارات
/check_credit نام_کاربری مبلغ - بررسی اعتبار نماینده

<b>💸 جریان نقدی:</b>
/cashflow_forecast [روز] - پیش‌بینی جریان نقدی
/cashflow_health - بررسی سلامت جریان نقدی

<b>📈 تحلیل سودآوری:</b>
/profit_analysis - تحلیل کامل سودآوری
/top_performers [تعداد] - لیست برترین نمایندگان

<b>🏪 تطبیق بانکی:</b>
/reconcile_status - وضعیت تطبیق بانکی

<b>📊 گزارش جامع:</b>
/advanced_report - گزارش کامل تمام بخش‌ها
      `;
      await bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
    });
  }

  /**
   * Format credit report for Telegram
   */
  private static formatCreditReport(report: any): string {
    return `
🏦 <b>گزارش اعتبارات</b>

💰 کل حد اعتبار: ${report.totalCreditLimit.toLocaleString('fa-IR')} تومان
💸 بدهی مصرف شده: ${report.totalDebtUtilized.toLocaleString('fa-IR')} تومان
📊 نرخ مصرف: ${report.utilizationRate.toFixed(1)}%

⚠️ <b>توزیع ریسک:</b>
🟢 کم: ${report.riskDistribution.low}
🟡 متوسط: ${report.riskDistribution.medium}
🟠 بالا: ${report.riskDistribution.high}
🔴 بحرانی: ${report.riskDistribution.critical}
    `.trim();
  }

  /**
   * Format cash flow forecast for Telegram
   */
  private static formatCashFlowForecast(forecast: any): string {
    const healthIcon = forecast.cashFlowHealth === 'healthy' ? '💚' : forecast.cashFlowHealth === 'warning' ? '⚠️' : '🚨';
    
    return `
💸 <b>پیش‌بینی جریان نقدی</b>

${healthIcon} وضعیت: ${forecast.cashFlowHealth === 'healthy' ? 'سالم' : forecast.cashFlowHealth === 'warning' ? 'هشدار' : 'بحرانی'}
💰 موجودی پیش‌بینی: ${forecast.projectedBalance.toLocaleString('fa-IR')} تومان
📈 درآمد پیش‌بینی: ${forecast.expectedIncome.toLocaleString('fa-IR')} تومان
📅 روزهای نقدینگی: ${forecast.liquidityDays} روز

${forecast.alerts && forecast.alerts.length > 0 ? 
  '⚠️ <b>هشدارها:</b>\n' + forecast.alerts.map((alert: any) => `• ${alert.message}`).join('\n') : 
  '✅ هیچ هشدار خاصی وجود ندارد'
}
    `.trim();
  }

  /**
   * Format profitability report for Telegram
   */
  private static formatProfitabilityReport(analysis: any): string {
    return `
📈 <b>تحلیل سودآوری</b>

💰 کل درآمد: ${analysis.totalRevenue.toLocaleString('fa-IR')} تومان
💚 سود خالص: ${analysis.netProfit.toLocaleString('fa-IR')} تومان
📊 حاشیه سود: ${analysis.profitMargin.toFixed(1)}%

🎯 <b>شاخص‌های کلیدی:</b>
💎 میانگین ارزش سفارش: ${analysis.averageOrderValue.toLocaleString('fa-IR')} تومان
🔄 نرخ حفظ مشتری: ${analysis.customerRetentionRate.toFixed(1)}%
⭐ ارزش دوره عمر: ${analysis.customerLifetimeValue.toLocaleString('fa-IR')} تومان
    `.trim();
  }

  /**
   * Format top performers for Telegram
   */
  private static formatTopPerformers(performers: any[]): string {
    let message = '🏆 <b>برترین نمایندگان</b>\n\n';
    
    performers.forEach((performer, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      message += `${medal} <b>${performer.storeName}</b>\n`;
      message += `💰 درآمد: ${performer.revenue.toLocaleString('fa-IR')} تومان\n`;
      message += `💚 سود: ${performer.profit.toLocaleString('fa-IR')} تومان\n`;
      message += `📊 حاشیه: ${performer.profitMargin.toFixed(1)}%\n\n`;
    });
    
    return message.trim();
  }

  /**
   * Format reconciliation status for Telegram
   */
  private static formatReconciliationStatus(status: any): string {
    return `
🏪 <b>وضعیت تطبیق بانکی</b>

✅ تطبیق شده: ${status.reconciledCount}
⏳ در انتظار: ${status.pendingCount}
❌ اختلاف: ${status.discrepancyCount}
💰 مجموع اختلاف: ${status.totalDiscrepancy.toLocaleString('fa-IR')} تومان

💳 موجودی بانک: ${status.bankBalance.toLocaleString('fa-IR')} تومان
🖥️ موجودی سیستم: ${status.systemBalance.toLocaleString('fa-IR')} تومان

📅 آخرین تطبیق: ${status.lastReconciliation ? new Date(status.lastReconciliation).toLocaleDateString('fa-IR') : 'هرگز'}
    `.trim();
  }

  /**
   * Format comprehensive advanced report for Telegram
   */
  private static formatAdvancedReport(data: any): string {
    const { credit, cashflow, profitability, reconciliation } = data;
    
    return `
📊 <b>گزارش جامع مدیریت مالی</b>

🏦 <b>اعتبارات:</b>
• نرخ مصرف: ${credit.utilizationRate.toFixed(1)}%
• نمایندگان پرخطر: ${credit.riskDistribution.high + credit.riskDistribution.critical}

💸 <b>جریان نقدی:</b>
• وضعیت: ${cashflow.cashFlowHealth === 'healthy' ? 'سالم' : 'نیاز به توجه'}
• روزهای نقدینگی: ${cashflow.liquidityDays}

📈 <b>سودآوری:</b>
• حاشیه سود: ${profitability.profitMargin.toFixed(1)}%
• سود خالص: ${profitability.netProfit.toLocaleString('fa-IR')} تومان

🏪 <b>تطبیق بانکی:</b>
• تطبیق شده: ${reconciliation.reconciledCount}
• اختلافات: ${reconciliation.discrepancyCount}

🎯 <b>خلاصه وضعیت:</b>
${this.generateOverallStatus(credit, cashflow, profitability, reconciliation)}
    `.trim();
  }

  /**
   * Generate overall status assessment
   */
  private static generateOverallStatus(credit: any, cashflow: any, profitability: any, reconciliation: any): string {
    const scores = [];
    
    // Credit score
    if (credit.utilizationRate < 70) scores.push('اعتبار سالم');
    else if (credit.utilizationRate < 85) scores.push('اعتبار در حد متوسط');
    else scores.push('اعتبار در خطر');
    
    // Cash flow score
    if (cashflow.cashFlowHealth === 'healthy') scores.push('جریان نقدی مطلوب');
    else scores.push('جریان نقدی نیاز به توجه دارد');
    
    // Profitability score
    if (profitability.profitMargin > 15) scores.push('سودآوری عالی');
    else if (profitability.profitMargin > 5) scores.push('سودآوری متوسط');
    else scores.push('سودآوری ضعیف');
    
    // Reconciliation score
    if (reconciliation.discrepancyCount === 0) scores.push('تطبیق کامل');
    else scores.push('وجود اختلاف در تطبیق');
    
    return scores.join('، ');
  }
}

// Already exported above, no need to duplicate