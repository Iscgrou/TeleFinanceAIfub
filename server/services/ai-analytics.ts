/**
 * AI Analytics Service - Phase 5.1
 * 
 * سیستم تحلیل هوشمند برای:
 * - تحلیل ترند بدهی نمایندگان
 * - پیش‌بینی مشکلات پرداخت
 * - تجزیه و تحلیل الگوهای رفتاری
 */

import { storage } from '../storage';
import type { 
  Representative, 
  Invoice, 
  Payment,
  SelectRepresentative,
  SelectInvoice,
  SelectPayment 
} from '@shared/schema';

// Types for AI Analytics
export interface DebtTrendAnalysis {
  representativeId: number;
  representativeName: string;
  currentDebt: number;
  debtTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedDebtIn30Days: number;
  recommendations: string[];
  analysisDate: Date;
}

export interface PaymentRiskAnalysis {
  representativeId: number;
  representativeName: string;
  riskScore: number; // 0-100, higher = more risk
  riskFactors: string[];
  paymentHistory: {
    averagePaymentDelay: number;
    missedPayments: number;
    totalPayments: number;
    onTimePaymentRate: number;
  };
  predictedNextPayment: Date | null;
  recommendations: string[];
}

export interface PerformanceAnalysis {
  representativeId: number;
  representativeName: string;
  performanceScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  benchmarkComparison: {
    averageDebt: number;
    representativeDebt: number;
    performancePercentile: number;
  };
}

/**
 * مرحله 5.1: تحلیل ترند بدهی
 * تحلیل الگوهای بدهی هر نماینده و پیش‌بینی روندهای آینده
 */
export class AIAnalyticsService {
  
  /**
   * تحلیل ترند بدهی برای یک نماینده خاص
   */
  async analyzeDebtTrend(representativeId: number): Promise<DebtTrendAnalysis> {
    try {
      const representative = await storage.getRepresentativeById(representativeId);
      if (!representative) {
        throw new Error(`Representative with ID ${representativeId} not found`);
      }

      // دریافت تاریخچه فاکتورها و پرداخت‌ها
      const invoices = await storage.getInvoicesByRepresentative(representativeId);
      const payments = await storage.getPaymentsByRepresentative(representativeId);
      
      // محاسبه بدهی فعلی
      const currentDebt = this.calculateCurrentDebt(invoices, payments);
      
      // تحلیل روند بدهی
      const trendAnalysis = this.analyzeDebtTrendPattern(invoices, payments);
      
      // پیش‌بینی بدهی آینده
      const predictedDebt = this.predictFutureDebt(trendAnalysis, currentDebt);
      
      // تعیین سطح ریسک
      const riskLevel = this.calculateRiskLevel(currentDebt, trendAnalysis.trendPercentage);
      
      // تولید توصیه‌ها
      const recommendations = this.generateDebtRecommendations(
        currentDebt, 
        trendAnalysis.trend, 
        riskLevel,
        representative
      );

      return {
        representativeId,
        representativeName: representative.storeName || representative.ownerName || `نماینده ${representativeId}`,
        currentDebt,
        debtTrend: trendAnalysis.trend,
        trendPercentage: trendAnalysis.trendPercentage,
        riskLevel,
        predictedDebtIn30Days: predictedDebt,
        recommendations,
        analysisDate: new Date()
      };
      
    } catch (error) {
      console.error('Error in debt trend analysis:', error);
      throw error;
    }
  }

  /**
   * تحلیل ترند بدهی برای همه نمایندگان
   */
  async analyzeAllDebtTrends(): Promise<DebtTrendAnalysis[]> {
    try {
      const representatives = await storage.getRepresentatives();
      const analyses: DebtTrendAnalysis[] = [];
      
      // تحلیل موثر برای همه نمایندگان
      for (const rep of representatives) {
        try {
          const analysis = await this.analyzeDebtTrend(rep.id);
          analyses.push(analysis);
        } catch (error) {
          console.error(`Failed to analyze debt trend for representative ${rep.id}:`, error);
          // ادامه تحلیل سایر نمایندگان
        }
      }

      // مرتب‌سازی بر اساس سطح ریسک
      return analyses.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });
      
    } catch (error) {
      console.error('Error in analyzing all debt trends:', error);
      throw error;
    }
  }

  /**
   * محاسبه بدهی فعلی بر اساس فاکتورها و پرداخت‌ها
   */
  private calculateCurrentDebt(invoices: Invoice[], payments: Payment[]): number {
    const totalInvoices = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalPayments = payments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);
    return Math.max(0, totalInvoices - totalPayments);
  }

  /**
   * تحلیل الگوی روند بدهی
   */
  private analyzeDebtTrendPattern(invoices: Invoice[], payments: Payment[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
  } {
    if (invoices.length < 2) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    // مرتب‌سازی فاکتورها بر اساس تاریخ
    const sortedInvoices = invoices.sort((a, b) => {
      const dateA = a.issueDate ? new Date(a.issueDate).getTime() : 0;
      const dateB = b.issueDate ? new Date(b.issueDate).getTime() : 0;
      return dateA - dateB;
    });

    // محاسبه روند در 30 روز گذشته
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = sortedInvoices.filter(inv => {
      const issueDate = inv.issueDate ? new Date(inv.issueDate) : null;
      return issueDate && issueDate >= thirtyDaysAgo;
    });

    const recentPayments = payments.filter(pay => {
      const paymentDate = pay.paymentDate ? new Date(pay.paymentDate) : null;
      return paymentDate && paymentDate >= thirtyDaysAgo;
    });

    const recentDebtChange = recentInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) -
                           recentPayments.reduce((sum, pay) => sum + parseFloat(pay.amount), 0);

    // تعیین روند
    let trend: 'increasing' | 'decreasing' | 'stable';
    let trendPercentage: number;

    if (recentDebtChange > 500000) { // افزایش بیش از 500 هزار تومان
      trend = 'increasing';
      trendPercentage = Math.min(100, (recentDebtChange / 1000000) * 10);
    } else if (recentDebtChange < -500000) { // کاهش بیش از 500 هزار تومان
      trend = 'decreasing';
      trendPercentage = Math.min(100, Math.abs(recentDebtChange / 1000000) * 10);
    } else {
      trend = 'stable';
      trendPercentage = Math.abs(recentDebtChange / 100000);
    }

    return { trend, trendPercentage };
  }

  /**
   * پیش‌بینی بدهی آینده
   */
  private predictFutureDebt(trendAnalysis: any, currentDebt: number): number {
    const { trend, trendPercentage } = trendAnalysis;
    
    let predictionFactor = 1;
    
    switch (trend) {
      case 'increasing':
        predictionFactor = 1 + (trendPercentage / 100);
        break;
      case 'decreasing':
        predictionFactor = Math.max(0, 1 - (trendPercentage / 100));
        break;
      case 'stable':
      default:
        predictionFactor = 1;
        break;
    }
    
    return Math.round(currentDebt * predictionFactor);
  }

  /**
   * تعیین سطح ریسک
   */
  private calculateRiskLevel(currentDebt: number, trendPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
    // معیارهای ریسک (بر اساس تومان)
    if (currentDebt > 10000000) { // بیش از 10 میلیون
      return 'critical';
    } else if (currentDebt > 5000000 || trendPercentage > 50) { // بیش از 5 میلیون یا روند بالای 50%
      return 'high';
    } else if (currentDebt > 1000000 || trendPercentage > 25) { // بیش از 1 میلیون یا روند بالای 25%
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * تولید توصیه‌های هوشمند
   */
  private generateDebtRecommendations(
    currentDebt: number, 
    trend: string, 
    riskLevel: string, 
    representative: Representative
  ): string[] {
    const recommendations: string[] = [];
    
    // توصیه‌های بر اساس سطح ریسک
    switch (riskLevel) {
      case 'critical':
        recommendations.push('🚨 اقدام فوری: تماس تلفنی برای مذاکره پرداخت');
        recommendations.push('📋 ارسال برنامه پرداخت اقساطی');
        recommendations.push('⚠️ در نظر گیری محدودیت سرویس');
        break;
      case 'high':
        recommendations.push('📞 تماس تلفنی در اولین فرصت');
        recommendations.push('💳 پیشنهاد پرداخت جزئی');
        recommendations.push('📊 بررسی تاریخچه پرداخت‌ها');
        break;
      case 'medium':
        recommendations.push('📱 ارسال یادآوری پرداخت');
        recommendations.push('📈 پیگیری منظم وضعیت');
        break;
      case 'low':
        recommendations.push('✅ وضعیت مناسب - پیگیری معمول');
        break;
    }

    // توصیه‌های بر اساس روند
    if (trend === 'increasing') {
      recommendations.push('📈 بدهی در حال افزایش - نیاز به بررسی علت');
      recommendations.push('🎯 تعیین سقف اعتباری جدید');
    } else if (trend === 'decreasing') {
      recommendations.push('📉 روند بدهی مثبت - ادامه پیگیری');
      recommendations.push('🎉 تشویق نماینده برای ادامه عملکرد خوب');
    }

    // توصیه‌های بر اساس مبلغ بدهی
    if (currentDebt > 0) {
      const paymentSuggestion = Math.ceil(currentDebt / 4); // پیشنهاد پرداخت 25%
      recommendations.push(`💰 پیشنهاد پرداخت حداقل ${paymentSuggestion.toLocaleString('fa-IR')} تومان`);
    }

    return recommendations.slice(0, 5); // حداکثر 5 توصیه
  }

  /**
   * تحلیل جمعی ترندهای بدهی
   */
  async getDebtTrendsOverview(): Promise<{
    totalAnalyzed: number;
    riskDistribution: Record<string, number>;
    averageDebt: number;
    totalDebt: number;
    trendingSummary: {
      increasing: number;
      decreasing: number;
      stable: number;
    };
  }> {
    try {
      const allTrends = await this.analyzeAllDebtTrends();
      
      return {
        totalAnalyzed: allTrends.length,
        riskDistribution: {
          critical: allTrends.filter(t => t.riskLevel === 'critical').length,
          high: allTrends.filter(t => t.riskLevel === 'high').length,
          medium: allTrends.filter(t => t.riskLevel === 'medium').length,
          low: allTrends.filter(t => t.riskLevel === 'low').length,
        },
        averageDebt: allTrends.reduce((sum, t) => sum + t.currentDebt, 0) / allTrends.length,
        totalDebt: allTrends.reduce((sum, t) => sum + t.currentDebt, 0),
        trendingSummary: {
          increasing: allTrends.filter(t => t.debtTrend === 'increasing').length,
          decreasing: allTrends.filter(t => t.debtTrend === 'decreasing').length,
          stable: allTrends.filter(t => t.debtTrend === 'stable').length,
        }
      };
      
    } catch (error) {
      console.error('Error in debt trends overview:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiAnalyticsService = new AIAnalyticsService();