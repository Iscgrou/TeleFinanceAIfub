import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getDashboardStats: vi.fn()
  }
}));

describe('Dashboard API', () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return comprehensive dashboard statistics', async () => {
      const mockStats = {
        totalRepresentatives: 199,
        totalDebt: '109300000',
        totalPaidAmount: '25000000',
        totalUnpaidAmount: '84300000',
        recentPayments: [
          {
            id: 1,
            representativeId: 5,
            amount: '500000',
            paymentDate: new Date('2025-07-19'),
            notes: 'پرداخت نقدی',
            representativeName: 'فروشگاه امید'
          },
          {
            id: 2,
            representativeId: 12,
            amount: '750000',
            paymentDate: new Date('2025-07-18'),
            notes: 'انتقال بانکی',
            representativeName: 'سوپرمارکت رضا'
          }
        ],
        topDebtors: [
          {
            id: 1,
            storeName: 'Bhrmimb',
            ownerName: 'محمد بهرامی',
            totalDebt: '8870000',
            panelUsername: 'bhrmimb'
          },
          {
            id: 2,
            storeName: 'isc_plus',
            ownerName: 'علی اکبری',
            totalDebt: '5290000',
            panelUsername: 'isc_plus'
          },
          {
            id: 3,
            storeName: 'Parsmb',
            ownerName: 'پارسا محمدی',
            totalDebt: '4340000',
            panelUsername: 'parsmb'
          }
        ],
        invoiceStats: {
          total: 199,
          unpaid: 199,
          partiallyPaid: 0,
          paid: 0
        },
        monthlyRevenue: [
          { month: 'فروردین', revenue: '15000000' },
          { month: 'اردیبهشت', revenue: '18000000' },
          { month: 'خرداد', revenue: '22000000' },
          { month: 'تیر', revenue: '25000000' }
        ]
      };

      vi.mocked(storage.getDashboardStats).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual({
        ...mockStats,
        recentPayments: mockStats.recentPayments.map(payment => ({
          ...payment,
          paymentDate: payment.paymentDate.toISOString()
        }))
      });
      expect(storage.getDashboardStats).toHaveBeenCalled();
    });

    it('should handle empty dashboard data', async () => {
      const emptyStats = {
        totalRepresentatives: 0,
        totalDebt: '0',
        totalPaidAmount: '0',
        totalUnpaidAmount: '0',
        recentPayments: [],
        topDebtors: [],
        invoiceStats: {
          total: 0,
          unpaid: 0,
          partiallyPaid: 0,
          paid: 0
        },
        monthlyRevenue: []
      };

      vi.mocked(storage.getDashboardStats).mockResolvedValue(emptyStats);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual(emptyStats);
    });

    it('should handle server errors gracefully', async () => {
      vi.mocked(storage.getDashboardStats).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(500);

      expect(response.body).toEqual({ message: 'Error fetching dashboard stats' });
    });

    it('should handle timeout errors', async () => {
      vi.mocked(storage.getDashboardStats).mockRejectedValue(new Error('Query timeout'));

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(500);

      expect(response.body).toEqual({ message: 'Error fetching dashboard stats' });
    });
  });
});