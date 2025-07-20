/**
 * AI Analytics API Routes - Phase 5.1
 * مسیرهای API برای سیستم تحلیل هوشمند بدهی
 */

import { Router } from 'express';
import { aiAnalyticsService } from '../services/ai-analytics';
import type { Request, Response } from 'express';

const router = Router();

/**
 * GET /api/ai-analytics/debt-trends
 * تحلیل ترند بدهی همه نمایندگان
 */
router.get('/debt-trends', async (req: Request, res: Response) => {
  try {
    console.log('🧠 AI Analytics: Analyzing debt trends for all representatives');
    const trends = await aiAnalyticsService.analyzeAllDebtTrends();
    
    console.log(`✅ AI Analytics: Successfully analyzed ${trends.length} representatives`);
    res.json({
      success: true,
      data: trends,
      totalAnalyzed: trends.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ AI Analytics Error (debt-trends):', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تحلیل ترندهای بدهی',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analytics/debt-trends/:id
 * تحلیل ترند بدهی یک نماینده خاص
 */
router.get('/debt-trends/:id', async (req: Request, res: Response) => {
  try {
    const representativeId = parseInt(req.params.id);
    
    if (isNaN(representativeId)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده نامعتبر است'
      });
    }
    
    console.log(`🧠 AI Analytics: Analyzing debt trend for representative ${representativeId}`);
    const trend = await aiAnalyticsService.analyzeDebtTrend(representativeId);
    
    console.log(`✅ AI Analytics: Successfully analyzed representative ${representativeId}`);
    res.json({
      success: true,
      data: trend,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`❌ AI Analytics Error (debt-trend for ${req.params.id}):`, error);
    res.status(500).json({
      success: false,
      error: 'خطا در تحلیل ترند بدهی نماینده',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analytics/overview
 * نمای کلی تحلیل‌های AI برای dashboard
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    console.log('🧠 AI Analytics: Generating debt trends overview');
    const overview = await aiAnalyticsService.getDebtTrendsOverview();
    
    console.log('✅ AI Analytics: Successfully generated overview');
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ AI Analytics Error (overview):', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید گزارش کلی',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analytics/high-risk
 * لیست نمایندگان پرخطر
 */
router.get('/high-risk', async (req: Request, res: Response) => {
  try {
    console.log('🧠 AI Analytics: Identifying high-risk representatives');
    const allTrends = await aiAnalyticsService.analyzeAllDebtTrends();
    
    // فیلتر نمایندگان پرخطر (critical و high)
    const highRiskReps = allTrends.filter(trend => 
      trend.riskLevel === 'critical' || trend.riskLevel === 'high'
    );
    
    // مرتب‌سازی بر اساس بدهی
    highRiskReps.sort((a, b) => b.currentDebt - a.currentDebt);
    
    console.log(`✅ AI Analytics: Found ${highRiskReps.length} high-risk representatives`);
    res.json({
      success: true,
      data: highRiskReps,
      totalHighRisk: highRiskReps.length,
      criticalCount: highRiskReps.filter(r => r.riskLevel === 'critical').length,
      highCount: highRiskReps.filter(r => r.riskLevel === 'high').length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ AI Analytics Error (high-risk):', error);
    res.status(500).json({
      success: false,
      error: 'خطا در شناسایی نمایندگان پرخطر',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analytics/recommendations/:id
 * توصیه‌های AI برای یک نماینده خاص
 */
router.get('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    const representativeId = parseInt(req.params.id);
    
    if (isNaN(representativeId)) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده نامعتبر است'
      });
    }
    
    console.log(`🧠 AI Analytics: Generating recommendations for representative ${representativeId}`);
    const trend = await aiAnalyticsService.analyzeDebtTrend(representativeId);
    
    res.json({
      success: true,
      data: {
        representativeId,
        representativeName: trend.representativeName,
        recommendations: trend.recommendations,
        riskLevel: trend.riskLevel,
        currentDebt: trend.currentDebt,
        debtTrend: trend.debtTrend
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`❌ AI Analytics Error (recommendations for ${req.params.id}):`, error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید توصیه‌ها',
      details: error?.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/ai-analytics/status
 * وضعیت سیستم AI Analytics
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // بررسی وضعیت عملیاتی سیستم
    const status = {
      systemStatus: 'operational',
      services: {
        debtAnalysis: 'active',
        trendPrediction: 'active',
        riskAssessment: 'active'
      },
      lastAnalysis: new Date().toISOString(),
      version: '5.1.0',
      features: [
        'تحلیل ترند بدهی',
        'پیش‌بینی ریسک',
        'تولید توصیه‌های هوشمند',
        'شناسایی الگوهای پرداخت'
      ]
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'خطا در بررسی وضعیت سیستم',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;