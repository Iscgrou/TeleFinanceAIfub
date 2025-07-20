import { Router } from 'express';
import { ProfitabilityAnalysisService } from '../services/profitability-analysis';
import { securityMiddleware, inputValidationMiddleware } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(inputValidationMiddleware);

// Analyze representative profitability
router.get('/representative/:id', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'تاریخ شروع و پایان الزامی است'
      });
    }

    const analysis = await ProfitabilityAnalysisService.analyzeRepresentativeProfitability(
      representativeId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing representative profitability:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تحلیل سودآوری نماینده'
    });
  }
});

// Company-wide profitability analysis
router.get('/company', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'تاریخ شروع و پایان الزامی است'
      });
    }

    const analysis = await ProfitabilityAnalysisService.analyzeCompanyProfitability(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing company profitability:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تحلیل سودآوری شرکت'
    });
  }
});

// Monthly profitability trends
router.get('/trends', async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const trends = await ProfitabilityAnalysisService.getMonthlyTrends(months);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting profitability trends:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت روندهای سودآوری'
    });
  }
});

// Identify unprofitable representatives
router.get('/unprofitable', async (req, res) => {
  try {
    const { startDate, endDate, threshold } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'تاریخ شروع و پایان الزامی است'
      });
    }

    const unprofitableReps = await ProfitabilityAnalysisService.identifyUnprofitableRepresentatives(
      new Date(startDate as string),
      new Date(endDate as string),
      threshold ? parseFloat(threshold as string) : 0
    );

    res.json({
      success: true,
      data: unprofitableReps
    });
  } catch (error) {
    console.error('Error identifying unprofitable representatives:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در شناسایی نمایندگان غیرسودآور'
    });
  }
});

// Break-even analysis
router.get('/break-even', async (req, res) => {
  try {
    const analysis = await ProfitabilityAnalysisService.calculateBreakEvenAnalysis();
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error calculating break-even analysis:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در محاسبه تحلیل سر به سر'
    });
  }
});

export default router;