import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../services/security-service';

// Extend Request type to include security context
declare global {
  namespace Express {
    interface Request {
      securityContext?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        isAuthenticated?: boolean;
        apiKey?: string;
      };
    }
  }
}

/**
 * Security middleware for API endpoints
 */
export const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract security context
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const apiKey = req.headers['x-api-key'] as string;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    // Set security context
    req.securityContext = {
      userId,
      ipAddress,
      userAgent,
      apiKey,
      isAuthenticated: false
    };

    // Validate API access
    const endpoint = req.path;
    const isAuthorized = await SecurityService.validateApiAccess(
      endpoint,
      userId,
      ipAddress,
      userAgent
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'دسترسی مجاز نیست',
        message: 'Access denied'
      });
    }

    // Check for suspicious activity
    const suspiciousCheck = await SecurityService.detectSuspiciousActivity(
      userId,
      `${req.method}_${endpoint}`
    );

    if (suspiciousCheck.isSuspicious) {
      await SecurityService.logSecurityEvent({
        userId,
        action: 'BLOCKED_SUSPICIOUS_ACTIVITY',
        resource: endpoint,
        details: { reason: suspiciousCheck.reason },
        ipAddress,
        userAgent,
        success: false
      });

      return res.status(429).json({
        success: false,
        error: 'فعالیت مشکوک تشخیص داده شد',
        message: 'Suspicious activity detected',
        blockDuration: suspiciousCheck.blockDuration
      });
    }

    req.securityContext.isAuthenticated = true;
    next();
  } catch (error) {
    console.error('Security middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در بررسی امنیت',
      message: 'Security check failed'
    });
  }
};

/**
 * Input validation middleware
 */
export const inputValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    for (const [key, value] of Object.entries(req.query)) {
      const validation = SecurityService.validateInput(value, `query.${key}`);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: `پارامتر نامعتبر: ${key}`,
          message: `Invalid parameter: ${key}`,
          threats: validation.threats
        });
      }
      req.query[key] = validation.sanitizedInput;
    }

    // Validate request body
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        const validation = SecurityService.validateInput(value, `body.${key}`);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: `داده نامعتبر: ${key}`,
            message: `Invalid data: ${key}`,
            threats: validation.threats
          });
        }
        req.body[key] = validation.sanitizedInput;
      }
    }

    next();
  } catch (error) {
    console.error('Input validation error:', error);
    res.status(500).json({
      success: false,
      error: 'خطا در اعتبارسنجی داده‌ها',
      message: 'Input validation failed'
    });
  }
};

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMinutes: number = 15
) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.securityContext?.ipAddress || 'unknown';
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;

      // Get or create request count for this client
      let clientData = requestCounts.get(clientId);
      
      if (!clientData || now > clientData.resetTime) {
        clientData = {
          count: 0,
          resetTime: now + windowMs
        };
      }

      clientData.count++;
      requestCounts.set(clientId, clientData);

      // Check if limit exceeded
      if (clientData.count > maxRequests) {
        await SecurityService.logSecurityEvent({
          userId: req.securityContext?.userId || 'anonymous',
          action: 'RATE_LIMIT_EXCEEDED',
          resource: req.path,
          details: { count: clientData.count, maxRequests, windowMinutes },
          ipAddress: req.securityContext?.ipAddress,
          userAgent: req.securityContext?.userAgent,
          success: false
        });

        return res.status(429).json({
          success: false,
          error: 'تعداد درخواست‌ها از حد مجاز گذشته',
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
        'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
      });

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next(); // Continue on error
    }
  };
};

/**
 * CORS security middleware
 */
export const corsSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  });

  // Handle CORS for Replit environment
  const allowedOrigins = [
    'http://localhost:5000',
    'http://0.0.0.0:5000',
    /\.replit\.app$/,
    /\.replit\.dev$/
  ];

  const origin = req.headers.origin;
  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    return origin && allowed.test(origin);
  });

  if (isAllowed) {
    res.set('Access-Control-Allow-Origin', origin || '*');
  }

  res.set({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-User-ID',
    'Access-Control-Allow-Credentials': 'true'
  });

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};