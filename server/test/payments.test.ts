import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import type { Payment } from '../../shared/schema';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    createPayment: vi.fn(),
    getPaymentsByRepresentative: vi.fn(),
    getPayments: vi.fn(),
    updatePayment: vi.fn(),
    deletePayment: vi.fn(),
    getPaymentById: vi.fn()
  }
}));

describe('Payments API', () => {
  let app: express.Express;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    vi.clearAllMocks();
  });

  describe('POST /api/payments', () => {
    it('should create a new payment with valid data', async () => {
      const newPaymentData = {
        representativeId: 1,
        amount: '50000',
        notes: 'پرداخت نقدی'
      };

      const createdPayment: Payment = {
        id: 1,
        representativeId: 1,
        amount: '50000',
        paymentDate: new Date(),
        notes: 'پرداخت نقدی'
      };

      vi.mocked(storage.createPayment).mockResolvedValue(createdPayment);

      const response = await request(app)
        .post('/api/payments')
        .send(newPaymentData)
        .expect(201);

      expect(response.body).toEqual({
        ...createdPayment,
        paymentDate: createdPayment.paymentDate.toISOString()
      });
      expect(storage.createPayment).toHaveBeenCalledWith(newPaymentData);
    });

    it('should reject payment with invalid amount', async () => {
      const invalidData = {
        representativeId: 1,
        amount: 'invalid',
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(storage.createPayment).not.toHaveBeenCalled();
    });

    it('should reject payment without representative ID', async () => {
      const invalidData = {
        amount: '50000',
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(storage.createPayment).not.toHaveBeenCalled();
    });

    it('should handle negative amounts', async () => {
      const negativeAmountData = {
        representativeId: 1,
        amount: '-5000',
        notes: 'برگشت وجه'
      };

      const response = await request(app)
        .post('/api/payments')
        .send(negativeAmountData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/payments', () => {
    it('should return all payments', async () => {
      const mockPayments: Payment[] = [
        {
          id: 1,
          representativeId: 1,
          amount: '50000',
          paymentDate: new Date('2025-07-19'),
          notes: 'پرداخت نقدی'
        },
        {
          id: 2,
          representativeId: 2,
          amount: '75000',
          paymentDate: new Date('2025-07-18'),
          notes: 'انتقال بانکی'
        }
      ];

      vi.mocked(storage.getPayments).mockResolvedValue(mockPayments);

      const response = await request(app)
        .get('/api/payments')
        .expect(200);

      expect(response.body).toEqual(mockPayments.map(payment => ({
        ...payment,
        paymentDate: payment.paymentDate.toISOString()
      })));
      expect(storage.getPayments).toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      vi.mocked(storage.getPayments).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/payments')
        .expect(500);

      expect(response.body).toEqual({ message: 'خطا در دریافت پرداخت‌ها' });
    });
  });

  describe('GET /api/payments/representative/:id', () => {
    it('should return payments for a specific representative', async () => {
      const repPayments: Payment[] = [
        {
          id: 3,
          representativeId: 1,
          amount: '100000',
          paymentDate: new Date('2025-07-19'),
          notes: 'پرداخت ماهانه'
        }
      ];

      vi.mocked(storage.getPaymentsByRepresentative).mockResolvedValue(repPayments);

      const response = await request(app)
        .get('/api/payments/representative/1')
        .expect(200);

      expect(response.body).toEqual(repPayments.map(payment => ({
        ...payment,
        paymentDate: payment.paymentDate.toISOString()
      })));
      expect(storage.getPaymentsByRepresentative).toHaveBeenCalledWith(1);
    });

    it('should return empty array for representative with no payments', async () => {
      vi.mocked(storage.getPaymentsByRepresentative).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/payments/representative/999')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('PATCH /api/payments/:id', () => {
    it('should update payment details', async () => {
      const updateData = {
        amount: '60000',
        notes: 'اصلاح مبلغ'
      };

      const updatedPayment: Payment = {
        id: 1,
        representativeId: 1,
        amount: '60000',
        paymentDate: new Date(),
        notes: 'اصلاح مبلغ'
      };

      vi.mocked(storage.updatePayment).mockResolvedValue(updatedPayment);

      const response = await request(app)
        .patch('/api/payments/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        ...updatedPayment,
        paymentDate: updatedPayment.paymentDate.toISOString()
      });
      expect(storage.updatePayment).toHaveBeenCalledWith(1, updateData);
    });

    it('should return 404 if payment not found', async () => {
      vi.mocked(storage.updatePayment).mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/payments/999')
        .send({ amount: '60000' })
        .expect(404);

      expect(response.body).toEqual({ message: 'پرداخت یافت نشد' });
    });
  });

  describe('DELETE /api/payments/:id', () => {
    it('should delete a payment successfully', async () => {
      vi.mocked(storage.deletePayment).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/payments/1')
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(storage.deletePayment).toHaveBeenCalledWith(1);
    });

    it('should return 404 if payment not found', async () => {
      vi.mocked(storage.deletePayment).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/payments/999')
        .expect(404);

      expect(response.body).toEqual({ message: 'پرداخت یافت نشد' });
    });
  });
});