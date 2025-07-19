import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import type { Invoice } from '@shared/schema';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getInvoiceById: vi.fn(),
    getRepresentativeById: vi.fn(),
    getInvoicesByRepresentative: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
    getInvoices: vi.fn(),
    processWeeklyInvoices: vi.fn()
  }
}));

// Mock invoice generator
vi.mock('../services/svg-invoice-generator', () => ({
  generateInvoiceImage: vi.fn()
}));

describe('Invoices API', () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    vi.clearAllMocks();
  });

  describe('GET /api/invoices/:id/detail', () => {
    it('should return invoice detail with line items', async () => {
      const mockInvoice = {
        id: 1,
        representativeId: 1,
        amount: '50000',
        status: 'unpaid' as const,
        issueDate: new Date('2025-07-19'),
        usageJsonDetails: [
          {
            description: 'ایجاد کاربر',
            amount: '30000',
            event_timestamp: '2025-07-18'
          },
          {
            description: 'تمدید سرویس',
            amount: '20000',
            event_timestamp: '2025-07-19'
          }
        ],
        isManual: false,
        usageHash: null,
        processingBatchId: null
      };

      vi.mocked(storage.getInvoiceById).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .get('/api/invoices/1/detail')
        .expect(200);

      expect(response.body.invoice).toEqual({
        ...mockInvoice,
        issueDate: mockInvoice.issueDate.toISOString()
      });
      expect(response.body.lineItems).toHaveLength(2);
      expect(response.body.lineItems[0]).toEqual({
        description: 'ایجاد کاربر',
        amount: 30000,
        date: '2025-07-18'
      });
    });

    it('should return 404 if invoice not found', async () => {
      vi.mocked(storage.getInvoiceById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/invoices/999/detail')
        .expect(404);

      expect(response.body).toEqual({ message: 'فاکتور یافت نشد' });
    });

    it('should handle invoices without usage details', async () => {
      const mockInvoice = {
        id: 2,
        representativeId: 1,
        amount: '75000',
        status: 'unpaid' as const,
        issueDate: new Date(),
        usageJsonDetails: null,
        isManual: true,
        usageHash: null,
        processingBatchId: null
      };

      vi.mocked(storage.getInvoiceById).mockResolvedValue(mockInvoice);

      const response = await request(app)
        .get('/api/invoices/2/detail')
        .expect(200);

      expect(response.body.lineItems).toEqual([]);
    });
  });

  describe('GET /api/test/invoice/:id', () => {
    it('should generate and return invoice image', async () => {
      const mockInvoice = {
        id: 1,
        representativeId: 1,
        amount: '50000',
        status: 'unpaid' as const,
        issueDate: new Date(),
        usageJsonDetails: null,
        isManual: false,
        usageHash: null,
        processingBatchId: null
      };

      const mockRep = {
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

      vi.mocked(storage.getInvoiceById).mockResolvedValue(mockInvoice);
      vi.mocked(storage.getRepresentativeById).mockResolvedValue(mockRep);

      // Mock PNG image buffer
      const mockImageBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const { generateInvoiceImage } = await import('../services/svg-invoice-generator');
      vi.mocked(generateInvoiceImage).mockResolvedValue(mockImageBuffer);

      const response = await request(app)
        .get('/api/test/invoice/1')
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.headers['content-disposition']).toBe('attachment; filename="invoice_1.png"');
    });

    it('should return 404 if invoice not found', async () => {
      vi.mocked(storage.getInvoiceById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/test/invoice/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Invoice not found in database' });
    });

    it('should return 404 if representative not found', async () => {
      const mockInvoice = {
        id: 1,
        representativeId: 999,
        amount: '50000',
        status: 'unpaid' as const,
        issueDate: new Date(),
        usageJsonDetails: null,
        isManual: false,
        usageHash: null,
        processingBatchId: null
      };

      vi.mocked(storage.getInvoiceById).mockResolvedValue(mockInvoice);
      vi.mocked(storage.getRepresentativeById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/test/invoice/1')
        .expect(404);

      expect(response.body).toEqual({ error: 'Representative not found in database' });
    });
  });

  describe('POST /api/invoices', () => {
    it('should create a new invoice with valid data', async () => {
      const newInvoiceData = {
        representativeId: 1,
        amount: '100000',
        status: 'unpaid',
        isManual: true
      };

      const createdInvoice = {
        id: 3,
        ...newInvoiceData,
        issueDate: new Date(),
        usageJsonDetails: null,
        usageHash: null,
        processingBatchId: null
      };

      vi.mocked(storage.createInvoice).mockResolvedValue(createdInvoice);

      const response = await request(app)
        .post('/api/invoices')
        .send(newInvoiceData)
        .expect(201);

      expect(response.body).toEqual({
        ...createdInvoice,
        issueDate: createdInvoice.issueDate.toISOString()
      });
      expect(storage.createInvoice).toHaveBeenCalledWith(newInvoiceData);
    });

    it('should reject invalid invoice data', async () => {
      const invalidData = {
        // Missing required fields
        amount: '100000'
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(storage.createInvoice).not.toHaveBeenCalled();
    });

    it('should validate amount is a valid number string', async () => {
      const invalidAmountData = {
        representativeId: 1,
        amount: 'invalid',
        status: 'unpaid'
      };

      const response = await request(app)
        .post('/api/invoices')
        .send(invalidAmountData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /api/invoices/:id', () => {
    it('should update invoice status', async () => {
      const updateData = {
        status: 'paid'
      };

      const updatedInvoice = {
        id: 1,
        representativeId: 1,
        amount: '50000',
        status: 'paid' as const,
        issueDate: new Date(),
        usageJsonDetails: null,
        isManual: false,
        usageHash: null,
        processingBatchId: null
      };

      vi.mocked(storage.updateInvoice).mockResolvedValue(updatedInvoice);

      const response = await request(app)
        .patch('/api/invoices/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedInvoice,
        issueDate: updatedInvoice.issueDate.toISOString()
      });
      expect(storage.updateInvoice).toHaveBeenCalledWith(1, updateData);
    });

    it('should validate status enum values', async () => {
      const invalidStatusData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .patch('/api/invoices/1')
        .send(invalidStatusData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/invoices/process-weekly', () => {
    it('should process weekly invoices from usage data', async () => {
      const usageData = {
        transactions: [
          {
            admin_username: 'testuser',
            amount: '50000',
            description: 'ایجاد کاربر',
            event_timestamp: '2025-07-19'
          }
        ]
      };

      const processResult = {
        success: true,
        totalProcessed: 1,
        totalAmount: '50000',
        invoicesCreated: 1
      };

      vi.mocked(storage.processWeeklyInvoices).mockResolvedValue(processResult);

      const response = await request(app)
        .post('/api/invoices/process-weekly')
        .send(usageData)
        .expect(200);

      expect(response.body).toEqual(processResult);
      expect(storage.processWeeklyInvoices).toHaveBeenCalledWith(usageData);
    });

    it('should handle processing errors', async () => {
      vi.mocked(storage.processWeeklyInvoices).mockRejectedValue(new Error('Processing failed'));

      const response = await request(app)
        .post('/api/invoices/process-weekly')
        .send({ transactions: [] })
        .expect(500);

      expect(response.body).toHaveProperty('message', 'خطا در پردازش فاکتورهای هفتگی');
    });
  });
});