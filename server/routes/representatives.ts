// Enhanced representatives API routes with pagination
import { Router } from 'express';
import { storage } from '../index';

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

export default router;