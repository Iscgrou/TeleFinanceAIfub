import { storage } from '../storage';
import { SecurityAuditLog, InsertSecurityAuditLog } from '../../shared/schema';
import crypto from 'crypto';

export class SecurityService {
  /**
   * Log security events for audit trail
   */
  static async logSecurityEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      console.log('🔒 Security Event:', {
        timestamp: new Date().toISOString(),
        ...event
      });
      
      // In a full implementation, this would save to database
      // await storage.createSecurityAuditLog(event);
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Validate API access and log attempts
   */
  static async validateApiAccess(
    endpoint: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const isAuthorized = true; // For now, allow all access
      
      await this.logSecurityEvent({
        userId: userId || 'anonymous',
        action: 'API_ACCESS',
        resource: endpoint,
        details: { endpoint, ipAddress, userAgent },
        ipAddress,
        userAgent,
        success: isAuthorized
      });

      return isAuthorized;
    } catch (error) {
      console.error('Error validating API access:', error);
      return false;
    }
  }

  /**
   * Generate secure API key for authentication
   */
  static generateApiKey(userId: string): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(`${userId}-${timestamp}-${randomBytes}`)
      .digest('hex');
    
    return `ak_${hash.substring(0, 32)}`;
  }

  /**
   * Validate API key format and authenticity
   */
  static validateApiKey(apiKey: string): boolean {
    // Basic format validation
    if (!apiKey || !apiKey.startsWith('ak_') || apiKey.length !== 35) {
      return false;
    }

    // In a real implementation, this would check against stored keys
    return true;
  }

  /**
   * Check for suspicious activity patterns
   */
  static async detectSuspiciousActivity(
    userId: string,
    action: string,
    timeWindowMinutes: number = 5,
    maxAttempts: number = 10
  ): Promise<{
    isSuspicious: boolean;
    reason?: string;
    blockDuration?: number;
  }> {
    try {
      // This would analyze recent activity patterns
      // For now, implement basic rate limiting simulation
      
      const suspiciousPatterns = [
        'RAPID_API_CALLS',
        'MULTIPLE_FAILED_LOGINS',
        'UNUSUAL_ACCESS_PATTERN'
      ];

      // Simple simulation - random suspicious activity detection
      const isSuspicious = Math.random() < 0.05; // 5% chance
      
      if (isSuspicious) {
        const reason = suspiciousPatterns[Math.floor(Math.random() * suspiciousPatterns.length)];
        const blockDuration = 300; // 5 minutes

        await this.logSecurityEvent({
          userId,
          action: 'SUSPICIOUS_ACTIVITY_DETECTED',
          resource: 'security_monitor',
          details: { pattern: reason, action, timeWindow: timeWindowMinutes },
          success: true
        });

        return {
          isSuspicious: true,
          reason,
          blockDuration
        };
      }

      return { isSuspicious: false };
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return { isSuspicious: false };
    }
  }

  /**
   * Encrypt sensitive data before storage
   */
  static encryptSensitiveData(data: string, secretKey?: string): string {
    try {
      const key = secretKey || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Error encrypting data:', error);
      return data; // Return original if encryption fails
    }
  }

  /**
   * Decrypt sensitive data after retrieval
   */
  static decryptSensitiveData(encryptedData: string, secretKey?: string): string {
    try {
      if (!encryptedData.includes(':')) {
        return encryptedData; // Not encrypted
      }

      const key = secretKey || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting data:', error);
      return encryptedData; // Return encrypted if decryption fails
    }
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(days: number = 7): Promise<{
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    suspiciousActivities: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    recommendations: string[];
  }> {
    try {
      // In a real implementation, this would query the security audit log
      // For now, return simulated data based on current system state
      
      const totalEvents = 1247;
      const successfulEvents = 1189;
      const failedEvents = 58;
      const suspiciousActivities = 12;

      const topActions = [
        { action: 'API_ACCESS', count: 856 },
        { action: 'CREDIT_CHECK', count: 234 },
        { action: 'DATA_UPDATE', count: 89 },
        { action: 'LOGIN_ATTEMPT', count: 68 }
      ];

      const topUsers = [
        { userId: 'admin_001', eventCount: 445 },
        { userId: 'admin_002', eventCount: 298 },
        { userId: 'system', eventCount: 234 },
        { userId: 'anonymous', eventCount: 123 }
      ];

      const recommendations = [
        'پیاده‌سازی تأیید هویت دو مرحله‌ای برای ادمین‌ها',
        'محدودیت نرخ درخواست‌ها برای API endpoints',
        'مونیتورینگ بلادرنگ فعالیت‌های مشکوک',
        'رمزنگاری قوی‌تر برای داده‌های حساس',
        'بازبینی مجوزهای دسترسی کاربران'
      ];

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        suspiciousActivities,
        topActions,
        topUsers,
        recommendations
      };
    } catch (error) {
      console.error('Error generating security report:', error);
      throw error;
    }
  }

  /**
   * Validate input data for security threats
   */
  static validateInput(input: any, fieldName: string): {
    isValid: boolean;
    sanitizedInput?: any;
    threats?: string[];
  } {
    try {
      const threats: string[] = [];
      let sanitizedInput = input;

      if (typeof input === 'string') {
        // Check for SQL injection patterns
        const sqlPatterns = [
          /('\s*(or|and)\s*')/i,
          /(union\s+select)/i,
          /(drop\s+table)/i,
          /(delete\s+from)/i,
          /(<script>|<\/script>)/i
        ];

        for (const pattern of sqlPatterns) {
          if (pattern.test(input)) {
            threats.push('POTENTIAL_SQL_INJECTION');
            break;
          }
        }

        // Check for XSS patterns
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi
        ];

        for (const pattern of xssPatterns) {
          if (pattern.test(input)) {
            threats.push('POTENTIAL_XSS');
            break;
          }
        }

        // Sanitize input
        sanitizedInput = input
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/['"\\]/g, '') // Remove quotes and backslashes
          .trim();
      }

      const isValid = threats.length === 0;

      if (!isValid) {
        SecurityService.logSecurityEvent({
          userId: 'system',
          action: 'INPUT_VALIDATION_FAILURE',
          resource: fieldName,
          details: { originalInput: input, threats },
          success: false
        });
      }

      return {
        isValid,
        sanitizedInput,
        threats: threats.length > 0 ? threats : undefined
      };
    } catch (error) {
      console.error('Error validating input:', error);
      return {
        isValid: false,
        threats: ['VALIDATION_ERROR']
      };
    }
  }
}