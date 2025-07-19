import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import type { Representative } from '@shared/schema';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getDashboardStats: vi.fn(),
    getRepresentatives: vi.fn(),
    getRepresentativeByPanelUsername: vi.fn(),
    getRepresentativeById: vi.fn(),
    getInvoicesByRepresentative: vi.fn(),
    getInvoiceById: vi.fn(),
    createRepresentative: vi.fn(),
    updateRepresentative: vi.fn(),
    deleteRepresentative: vi.fn(),
    getRepresentativesPaginated: vi.fn(),
    getRepresentativesPerformanceTest: vi.fn()
  }
}));

describe('Representatives API', () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/representatives', () => {
    it('should return all representatives on success', async () => {
      const mockRepresentatives: Representative[] = [
        {
          id: 1,
          storeName: 'Test Store',
          ownerName: 'Test Owner',
          phone: '09123456789',
          telegramId: null,
          panelUsername: 'testuser',
          salesColleagueName: 'Test Colleague',
          totalDebt: '10000',
          colleagueId: 1,
          isActive: true,
          createdAt: new Date()
        }
      ];

      vi.mocked(storage.getRepresentatives).mockResolvedValue(mockRepresentatives);

      const response = await request(app)
        .get('/api/representatives')
        .expect(200);

      expect(response.body).toEqual(mockRepresentatives.map(rep => ({
        ...rep,
        createdAt: rep.createdAt.toISOString()
      })));
      expect(storage.getRepresentatives).toHaveBeenCalledOnce();
    });

    it('should handle server errors', async () => {
      vi.mocked(storage.getRepresentatives).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/representatives')
        .expect(500);

      expect(response.body).toEqual({ message: 'Error fetching representatives' });
    });
  });

  describe('GET /api/representatives/by-username/:username', () => {
    it('should return representative by panel username', async () => {
      const mockRep: Representative = {
        id: 1,
        storeName: 'Test Store',
        ownerName: 'Test Owner',
        phone: '09123456789',
        telegramId: null,
        panelUsername: 'testuser',
        salesColleagueName: 'Test Colleague',
        totalDebt: '10000',
        colleagueId: 1,
        isActive: true,
        createdAt: new Date()
      };

      vi.mocked(storage.getRepresentativeByPanelUsername).mockResolvedValue(mockRep);

      const response = await request(app)
        .get('/api/representatives/by-username/testuser')
        .expect(200);

      expect(response.body).toEqual({
        ...mockRep,
        createdAt: mockRep.createdAt.toISOString()
      });
      expect(storage.getRepresentativeByPanelUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return 404 if representative not found', async () => {
      vi.mocked(storage.getRepresentativeByPanelUsername).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/representatives/by-username/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ message: 'نماینده یافت نشد' });
    });

    it('should handle server errors', async () => {
      vi.mocked(storage.getRepresentativeByPanelUsername).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/representatives/by-username/testuser')
        .expect(500);

      expect(response.body).toEqual({ message: 'خطا در دریافت اطلاعات نماینده' });
    });
  });

  describe('GET /api/representatives/:id/invoices', () => {
    it('should return invoices for a representative', async () => {
      const mockInvoices = [
        {
          id: 1,
          representativeId: 1,
          amount: '50000',
          status: 'unpaid' as const,
          issueDate: new Date(),
          usageJsonDetails: null,
          isManual: false,
          usageHash: null,
          processingBatchId: null
        }
      ];

      vi.mocked(storage.getInvoicesByRepresentative).mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/api/representatives/1/invoices')
        .expect(200);

      expect(response.body).toEqual(mockInvoices.map(inv => ({
        ...inv,
        issueDate: inv.issueDate.toISOString()
      })));
      expect(storage.getInvoicesByRepresentative).toHaveBeenCalledWith(1);
    });

    it('should handle invalid representative ID', async () => {
      const response = await request(app)
        .get('/api/representatives/invalid/invoices')
        .expect(200);

      expect(storage.getInvoicesByRepresentative).toHaveBeenCalledWith(NaN);
    });

    it('should handle server errors', async () => {
      vi.mocked(storage.getInvoicesByRepresentative).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/representatives/1/invoices')
        .expect(500);

      expect(response.body).toEqual({ message: 'خطا در دریافت فاکتورها' });
    });
  });

  describe('POST /api/representatives', () => {
    it('should create a new representative with valid data', async () => {
      const newRepData = {
        storeName: 'New Store',
        ownerName: 'New Owner',
        phone: '09123456789',
        panelUsername: 'newuser',
        salesColleagueName: 'Test Colleague',
        colleagueId: 1,
        isActive: true
      };

      const createdRep = {
        id: 2,
        ...newRepData,
        telegramId: null,
        totalDebt: '0',
        createdAt: new Date()
      };

      vi.mocked(storage.createRepresentative).mockResolvedValue(createdRep);

      const response = await request(app)
        .post('/api/representatives')
        .send(newRepData)
        .expect(201);

      expect(response.body).toEqual({
        ...createdRep,
        createdAt: createdRep.createdAt.toISOString()
      });
      expect(storage.createRepresentative).toHaveBeenCalledWith(newRepData);
    });

    it('should reject invalid data with 400 status', async () => {
      const invalidData = {
        storeName: 'New Store'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/representatives')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(storage.createRepresentative).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/representatives/:id', () => {
    it('should update a representative with valid data', async () => {
      const updateData = {
        storeName: 'Updated Store',
        ownerName: 'Updated Owner'
      };

      const updatedRep = {
        id: 1,
        storeName: 'Updated Store',
        ownerName: 'Updated Owner',
        phone: '09123456789',
        telegramId: null,
        panelUsername: 'testuser',
        salesColleagueName: 'Test Colleague',
        totalDebt: '10000',
        colleagueId: 1,
        isActive: true,
        createdAt: new Date()
      };

      vi.mocked(storage.updateRepresentative).mockResolvedValue(updatedRep);

      const response = await request(app)
        .patch('/api/representatives/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedRep,
        createdAt: updatedRep.createdAt.toISOString()
      });
      expect(storage.updateRepresentative).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 if representative not found', async () => {
      vi.mocked(storage.updateRepresentative).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/representatives/999')
        .send({ storeName: 'Updated' })
        .expect(404);

      expect(response.body).toEqual({ message: 'نماینده یافت نشد' });
    });
  });

  describe('DELETE /api/representatives/:id', () => {
    it('should delete a representative successfully', async () => {
      vi.mocked(storage.deleteRepresentative).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/representatives/1')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(storage.deleteRepresentative).toHaveBeenCalledWith(1);
    });

    it('should return 404 if representative not found', async () => {
      vi.mocked(storage.deleteRepresentative).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/representatives/999')
        .expect(404);

      expect(response.body).toEqual({ message: 'نماینده یافت نشد' });
    });
  });
});