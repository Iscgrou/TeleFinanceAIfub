import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getAdminByChatId: vi.fn()
  }
}));

describe('Authentication Middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Test route that requires authentication
    app.get('/api/test/protected', async (req, res) => {
      const adminChatId = req.headers['x-admin-id'];
      
      if (!adminChatId) {
        return res.status(401).json({ message: 'لطفاً ابتدا وارد شوید' });
      }

      const admin = await storage.getAdminByChatId(adminChatId as string);
      
      if (!admin) {
        return res.status(403).json({ message: 'دسترسی غیرمجاز' });
      }

      res.json({ 
        message: 'دسترسی موفق',
        admin: {
          chatId: admin.chatId,
          fullName: admin.fullName,
          isSuperAdmin: admin.isSuperAdmin
        }
      });
    });
    
    vi.clearAllMocks();
  });

  describe('Protected Routes', () => {
    it('should reject requests without admin header', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .expect(401);

      expect(response.body).toEqual({ message: 'لطفاً ابتدا وارد شوید' });
      expect(storage.getAdminByChatId).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid admin ID', async () => {
      vi.mocked(storage.getAdminByChatId).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/test/protected')
        .set('x-admin-id', '999999')
        .expect(403);

      expect(response.body).toEqual({ message: 'دسترسی غیرمجاز' });
      expect(storage.getAdminByChatId).toHaveBeenCalledWith('999999');
    });

    it('should allow access for valid admin', async () => {
      const mockAdmin = {
        chatId: '123456',
        fullName: 'مدیر تست',
        isSuperAdmin: false,
        createdAt: new Date()
      };

      vi.mocked(storage.getAdminByChatId).mockResolvedValue(mockAdmin);

      const response = await request(app)
        .get('/api/test/protected')
        .set('x-admin-id', '123456')
        .expect(200);

      expect(response.body).toEqual({
        message: 'دسترسی موفق',
        admin: {
          chatId: '123456',
          fullName: 'مدیر تست',
          isSuperAdmin: false
        }
      });
    });

    it('should allow access for super admin', async () => {
      const mockSuperAdmin = {
        chatId: '111111',
        fullName: 'مدیر ارشد',
        isSuperAdmin: true,
        createdAt: new Date()
      };

      vi.mocked(storage.getAdminByChatId).mockResolvedValue(mockSuperAdmin);

      const response = await request(app)
        .get('/api/test/protected')
        .set('x-admin-id', '111111')
        .expect(200);

      expect(response.body.admin.isSuperAdmin).toBe(true);
    });
  });

  describe('Super Admin Only Routes', () => {
    beforeEach(() => {
      // Add a super admin only route
      app.post('/api/test/super-admin-only', async (req, res) => {
        const adminChatId = req.headers['x-admin-id'];
        
        if (!adminChatId) {
          return res.status(401).json({ message: 'لطفاً ابتدا وارد شوید' });
        }

        const admin = await storage.getAdminByChatId(adminChatId as string);
        
        if (!admin) {
          return res.status(403).json({ message: 'دسترسی غیرمجاز' });
        }

        if (!admin.isSuperAdmin) {
          return res.status(403).json({ message: 'فقط مدیر ارشد می‌تواند این عملیات را انجام دهد' });
        }

        res.json({ message: 'عملیات مدیر ارشد انجام شد' });
      });
    });

    it('should reject regular admins from super admin routes', async () => {
      const mockRegularAdmin = {
        chatId: '222222',
        fullName: 'مدیر معمولی',
        isSuperAdmin: false,
        createdAt: new Date()
      };

      vi.mocked(storage.getAdminByChatId).mockResolvedValue(mockRegularAdmin);

      const response = await request(app)
        .post('/api/test/super-admin-only')
        .set('x-admin-id', '222222')
        .expect(403);

      expect(response.body).toEqual({ 
        message: 'فقط مدیر ارشد می‌تواند این عملیات را انجام دهد' 
      });
    });

    it('should allow super admins to access super admin routes', async () => {
      const mockSuperAdmin = {
        chatId: '111111',
        fullName: 'مدیر ارشد',
        isSuperAdmin: true,
        createdAt: new Date()
      };

      vi.mocked(storage.getAdminByChatId).mockResolvedValue(mockSuperAdmin);

      const response = await request(app)
        .post('/api/test/super-admin-only')
        .set('x-admin-id', '111111')
        .expect(200);

      expect(response.body).toEqual({ message: 'عملیات مدیر ارشد انجام شد' });
    });
  });
});