import { Router } from 'express';
import { SecurityService } from '../services/security-service';
import { securityMiddleware, inputValidationMiddleware } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(inputValidationMiddleware);

// Generate security report
router.get('/report', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const report = await SecurityService.generateSecurityReport(days);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید گزارش امنیت'
    });
  }
});

// Generate API key
router.post('/generate-api-key', async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.securityContext?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'شناسه کاربر الزامی است'
      });
    }

    const apiKey = SecurityService.generateApiKey(userId);
    
    await SecurityService.logSecurityEvent({
      userId: adminId || 'system',
      action: 'API_KEY_GENERATED',
      resource: 'security',
      details: { targetUserId: userId },
      success: true
    });

    res.json({
      success: true,
      data: { apiKey }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تولید کلید API'
    });
  }
});

// Validate API key
router.post('/validate-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'کلید API الزامی است'
      });
    }

    const isValid = SecurityService.validateApiKey(apiKey);
    
    res.json({
      success: true,
      data: { isValid }
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در اعتبارسنجی کلید API'
    });
  }
});

// Detect suspicious activity for specific user
router.get('/suspicious-activity/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, timeWindow, maxAttempts } = req.query;

    const result = await SecurityService.detectSuspiciousActivity(
      userId,
      action as string || 'GENERAL_ACCESS',
      timeWindow ? parseInt(timeWindow as string) : 5,
      maxAttempts ? parseInt(maxAttempts as string) : 10
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در تشخیص فعالیت مشکوک'
    });
  }
});

export default router;