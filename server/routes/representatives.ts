// Enhanced representatives API routes with pagination
import { Router } from 'express';
import { storage } from '../storage';
import type { Representative } from '@shared/schema';

const router = Router();

// Get paginated representatives with search and sorting
router.get('/paginated', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeInactive = 'false'
    } = req.query;

    const params = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      sortBy: sortBy as keyof Representative,
      sortOrder: sortOrder as 'asc' | 'desc',
      includeInactive: includeInactive === 'true'
    };

    const result = await (storage as any).getRepresentativesPaginated(params);
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error in paginated representatives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch paginated representatives'
    });
  }
});

// Performance test endpoint
router.get('/performance-test', async (req, res) => {
  try {
    const startTime = performance.now();
    
    // Test different page sizes
    const tests = [
      { page: 1, limit: 10 },
      { page: 1, limit: 50 },
      { page: 1, limit: 100 },
      { page: 2, limit: 50 },
      { page: 5, limit: 20 }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const testStart = performance.now();
      const result = await (storage as any).getRepresentativesPaginated(test);
      const testEnd = performance.now();
      
      results.push({
        ...test,
        duration: `${(testEnd - testStart).toFixed(2)}ms`,
        recordCount: result.data.length,
        totalRecords: result.total
      });
    }
    
    const endTime = performance.now();
    
    res.json({
      success: true,
      totalDuration: `${(endTime - startTime).toFixed(2)}ms`,
      tests: results,
      recommendation: results.length > 0 ? 
        `Optimal page size appears to be ${results.reduce((best, current) => 
          parseFloat(current.duration) < parseFloat(best.duration) ? current : best
        ).limit} records per page` : 'No data available'
    });
  } catch (error) {
    console.error('Performance test error:', error);
    res.status(500).json({
      success: false,
      error: 'Performance test failed'
    });
  }
});

// Get representative profile by ID with complete details
router.get('/:id/profile', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.id);
    
    // Get representative details
    const representative = await storage.getRepresentativeById(representativeId);
    if (!representative) {
      return res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }
    
    // Get their invoices and payments
    const [invoices, payments] = await Promise.all([
      storage.getInvoicesByRepresentative(representativeId),
      storage.getPaymentsByRepresentative(representativeId)
    ]);
    
    // Calculate statistics
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid');
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const partiallyPaidInvoices = invoices.filter(invoice => invoice.status === 'partially_paid');
    
    res.json({
      success: true,
      representative,
      statistics: {
        totalInvoiced,
        totalPaid,
        totalDebt: parseFloat(representative.totalDebt),
        invoiceCount: invoices.length,
        paymentCount: payments.length,
        unpaidCount: unpaidInvoices.length,
        paidCount: paidInvoices.length,
        partiallyPaidCount: partiallyPaidInvoices.length
      },
      invoices: invoices.map(invoice => ({
        ...invoice,
        amount: parseFloat(invoice.amount)
      })),
      payments: payments.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount)
      }))
    });
  } catch (error) {
    console.error('Error fetching representative profile:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت پروفایل نماینده'
    });
  }
});

// Get representative portal data for public access
router.get('/portal/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // Find representative by panel username
    const representative = await storage.getRepresentativeByPanelUsername(username);
    if (!representative) {
      return res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }
    
    // Get their invoices
    const invoices = await storage.getInvoicesByRepresentative(representative.id);
    
    res.json({
      success: true,
      representative: {
        id: representative.id,
        storeName: representative.storeName,
        ownerName: representative.ownerName,
        panelUsername: representative.panelUsername,
        totalDebt: representative.totalDebt,
        isActive: representative.isActive,
        createdAt: representative.createdAt
      },
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount,
        status: invoice.status,
        issueDate: invoice.issueDate,
        usageJsonDetails: invoice.usageJsonDetails
      }))
    });
  } catch (error) {
    console.error('Error fetching representative portal data:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در دریافت اطلاعات پورتال نماینده'
    });
  }
});

// Update representative information
router.patch('/:id', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedRepresentative = await storage.updateRepresentative(representativeId, updateData);
    
    if (!updatedRepresentative) {
      return res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }
    
    res.json({
      success: true,
      representative: updatedRepresentative
    });
  } catch (error) {
    console.error('Error updating representative:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در به‌روزرسانی نماینده'
    });
  }
});

// Delete representative
router.delete('/:id', async (req, res) => {
  try {
    const representativeId = parseInt(req.params.id);
    
    const deleted = await storage.deleteRepresentative(representativeId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'نماینده یافت نشد'
      });
    }
    
    res.json({
      success: true,
      message: 'نماینده با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting representative:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در حذف نماینده'
    });
  }
});

export default router;