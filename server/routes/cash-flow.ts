import { Router } from 'express';
import { CashFlowForecastingService } from '../services/cash-flow-forecasting';
import { securityMiddleware, inputValidationMiddleware } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(inputValidationMiddleware);

// Generate monthly cash flow forecast
router.get('/forecast/monthly', async (req, res) => {
  try {
    const forecasts = await CashFlowForecastingService.generateMonthlyForecast();
    
    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error generating monthly forecast:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید پیش‌بینی ماهانه'
    });
  }
});

// Get weekly cash flow summary
router.get('/summary/weekly', async (req, res) => {
  try {
    const summary = await CashFlowForecastingService.getWeeklySummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید خلاصه هفتگی'
    });
  }
});

export default router;