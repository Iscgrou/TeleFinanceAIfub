/**
 * PHASE 7.3: Security Hardening Utilities
 * ابزارهای امنیتی سخت‌کردن سیستم
 */

import { z } from 'zod';

// Input sanitization functions
export class SecurityUtils {
  // Sanitize string input to prevent XSS
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove basic HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate and sanitize numeric input
  static sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
  }

  // Rate limiting for API requests
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }

      const userRequests = requests.get(identifier)!;
      
      // Remove old requests
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }

      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true; // Request allowed
    };
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate file uploads
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    valid: boolean;
    error?: string;
  } {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'نوع فایل مجاز نیست' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'اندازه فایل بیش از حد مجاز است' };
    }

    return { valid: true };
  }

  // Content Security Policy helpers
  static generateNonce(): string {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  }

  // Secure headers configuration
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }
}

// Validation schemas for common inputs
export const ValidationSchemas = {
  // Representative data validation
  representative: z.object({
    name: z.string()
      .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
      .max(100, 'نام نباید بیش از ۱۰۰ کاراکتر باشد')
      .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]+$/, 'نام فقط شامل حروف فارسی و انگلیسی'),
    phone: z.string()
      .regex(/^(\+98|0)?9\d{9}$/, 'شماره تلفن معتبر نیست'),
    email: z.string()
      .email('ایمیل معتبر نیست')
      .optional()
      .or(z.literal('')),
    debt: z.number()
      .min(0, 'مبلغ بدهی نمی‌تواند منفی باشد')
      .max(999999999999, 'مبلغ بدهی بیش از حد مجاز است'),
  }),

  // Invoice data validation
  invoice: z.object({
    representativeId: z.number().int().positive('شناسه نماینده معتبر نیست'),
    amount: z.number()
      .positive('مبلغ باید مثبت باشد')
      .max(999999999999, 'مبلغ بیش از حد مجاز است'),
    description: z.string()
      .max(500, 'توضیحات نباید بیش از ۵۰۰ کاراکتر باشد')
      .optional(),
    dueDate: z.string().datetime('تاریخ سررسید معتبر نیست'),
  }),

  // Alert rule validation
  alertRule: z.object({
    name: z.string()
      .min(3, 'نام قانون باید حداقل ۳ کاراکتر باشد')
      .max(100, 'نام قانون نباید بیش از ۱۰۰ کاراکتر باشد'),
    condition: z.string()
      .min(1, 'شرط قانون الزامی است'),
    priority: z.number()
      .int()
      .min(1, 'اولویت باید بین ۱ تا ۵ باشد')
      .max(5, 'اولویت باید بین ۱ تا ۵ باشد'),
    isActive: z.boolean(),
  }),

  // Search queries validation
  searchQuery: z.object({
    q: z.string()
      .max(200, 'جستجو نباید بیش از ۲۰۰ کاراکتر باشد')
      .optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};

// Audit logging for security events
export class SecurityLogger {
  private static logs: Array<{
    timestamp: Date;
    event: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: any;
  }> = [];

  static logSecurityEvent(
    event: string,
    userId?: string,
    details?: any
  ): void {
    this.logs.push({
      timestamp: new Date(),
      event,
      userId,
      ip: 'masked', // In production, get real IP
      userAgent: navigator.userAgent,
      details,
    });

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // In production, send to secure logging service
    if (process.env.NODE_ENV === 'production') {
      console.warn('🔒 Security Event:', { event, userId, details });
    }
  }

  static getSecurityLogs(limit: number = 100): typeof this.logs {
    return this.logs.slice(-limit);
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// Session security helpers
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static lastActivity = Date.now();

  static updateActivity(): void {
    this.lastActivity = Date.now();
  }

  static isSessionExpired(): boolean {
    return Date.now() - this.lastActivity > this.SESSION_TIMEOUT;
  }

  static getRemainingTime(): number {
    const remaining = this.SESSION_TIMEOUT - (Date.now() - this.lastActivity);
    return Math.max(0, remaining);
  }

  static setupActivityTracking(): void {
    // Track user activity
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    
    const updateActivity = () => this.updateActivity();
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check session periodically
    setInterval(() => {
      if (this.isSessionExpired()) {
        SecurityLogger.logSecurityEvent('SESSION_EXPIRED');
        // Redirect to login or show session expired modal
        window.location.href = '/login';
      }
    }, 60000); // Check every minute
  }
}

// Data encryption helpers (for sensitive data)
export class EncryptionUtils {
  // Simple obfuscation for client-side (not secure, just obscures)
  static obfuscate(data: string): string {
    return btoa(encodeURIComponent(data));
  }

  static deobfuscate(obfuscated: string): string {
    try {
      return decodeURIComponent(atob(obfuscated));
    } catch {
      return '';
    }
  }

  // Hash generation for data integrity
  static async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify data integrity
  static async verifyHash(data: string, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateHash(data);
    return actualHash === expectedHash;
  }
}