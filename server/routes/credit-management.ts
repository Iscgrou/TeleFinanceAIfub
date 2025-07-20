import { Router } from 'express';
import { CreditManagementService } from '../services/credit-management';
import { securityMiddleware, inputValidationMiddleware } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(inputValidationMiddleware);

// Check credit availability
router.post('/check-availability', async (req, res) => {
  try {
    const { representativeId, requestedAmount } = req.body;
    
    if (!representativeId || !requestedAmount) {
      return res.status(400).json({
        success: false,
        error: 'شناسه نماینده و مبلغ درخواستی الزامی است'
      });
    }

    const result = await CreditManagementService.checkCreditAvailability(
      parseInt(representativeId),
      parseFloat(requestedAmount)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking credit availability:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در بررسی اعتبار'
    });
  }
});

// Update credit limit
router.patch('/update-limit', async (req, res) => {
  try {
    const { representativeId, newCreditLimit, adjustReason } = req.body;
    const adminId = req.securityContext?.userId || 'unknown';

    if (!representativeId || !newCreditLimit || !adjustReason) {
      return res.status(400).json({
        success: false,
        error: 'تمام فیلدها الزامی است'
      });
    }

    const success = await CreditManagementService.updateCreditLimit(
      parseInt(representativeId),
      parseFloat(newCreditLimit),
      adjustReason,
      adminId
    );

    if (success) {
      res.json({
        success: true,
        message: 'حد اعتبار با موفقیت به‌روزرسانی شد'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }
  } catch (error) {
    console.error('Error updating credit limit:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی حد اعتبار'
    });
  }
});

// Auto-adjust credit limits
router.post('/auto-adjust', async (req, res) => {
  try {
    await CreditManagementService.autoAdjustCreditLimits();
    
    res.json({
      success: true,
      message: 'تنظیم خودکار حدود اعتبار انجام شد'
    });
  } catch (error) {
    console.error('Error auto-adjusting credit limits:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تنظیم خودکار حدود اعتبار'
    });
  }
});

// Generate credit report
router.get('/report', async (req, res) => {
  try {
    const report = await CreditManagementService.generateCreditReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating credit report:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید گزارش اعتبار'
    });
  }
});

export default router;