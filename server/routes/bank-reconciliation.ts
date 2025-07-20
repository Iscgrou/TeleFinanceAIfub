import { Router } from 'express';
import { BankReconciliationService } from '../services/bank-reconciliation';
import { securityMiddleware, inputValidationMiddleware } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(inputValidationMiddleware);

// Import bank statement
router.post('/import', async (req, res) => {
  try {
    const { bankData, importBatch } = req.body;

    if (!bankData || !Array.isArray(bankData) || !importBatch) {
      return res.status(400).json({
        success: false,
        error: 'داده‌های بانکی و شناسه batch الزامی است'
      });
    }

    const result = await BankReconciliationService.importBankStatement(bankData, importBatch);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error importing bank statement:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در وارد کردن صورتحساب بانکی'
    });
  }
});

// Manual reconciliation
router.post('/reconcile', async (req, res) => {
  try {
    const { bankReference, paymentId } = req.body;
    const adminId = req.securityContext?.userId;

    if (!bankReference || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'مرجع بانکی و شناسه پرداخت الزامی است'
      });
    }

    const success = await BankReconciliationService.reconcileTransaction(
      bankReference,
      parseInt(paymentId),
      adminId
    );

    if (success) {
      res.json({
        success: true,
        message: 'تطبیق با موفقیت انجام شد'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'خطا در انجام تطبیق'
      });
    }
  } catch (error) {
    console.error('Error reconciling transaction:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تطبیق تراکنش'
    });
  }
});

// Get reconciliation report
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await BankReconciliationService.getReconciliationReport(start, end);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating reconciliation report:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید گزارش تطبیق'
    });
  }
});

// Get suggested matches
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await BankReconciliationService.getSuggestedMatches();
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting suggested matches:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت پیشنهادات تطبیق'
    });
  }
});

// Export reconciliation report
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const csv = await BankReconciliationService.exportReconciliationReport(start, end);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=reconciliation-report.csv');
    res.send('\ufeff' + csv); // Add BOM for proper UTF-8 encoding
  } catch (error) {
    console.error('Error exporting reconciliation report:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در خروجی گزارش تطبیق'
    });
  }
});

export default router;