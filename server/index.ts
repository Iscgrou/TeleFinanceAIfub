import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Essential for Replit deployments - trust proxy
app.set('trust proxy', true);

// Enhanced CORS for Safari/iOS - No wildcards, explicit origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (file://, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Log Safari/iOS origins for debugging
    if (origin.includes('safari-web-app') || origin.includes('file://')) {
      console.log(`[CORS] iOS/Safari Origin: ${origin}`);
    }
    
    // Always allow Replit domains and local development
    const allowedPatterns = [
      /^https?:\/\/.*\.replit\.dev$/,
      /^https?:\/\/.*\.repl\.co$/,
      /^https?:\/\/.*\.replit\.app$/,
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/0\.0\.0\.0(:\d+)?$/,
      /^file:\/\//  // Allow file:// protocol for iOS WebView
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    
    if (!isAllowed) {
      console.log(`[CORS] Blocked origin: ${origin}`);
    }
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'Accept',
    'Accept-Language',
    'Accept-Encoding',
    'User-Agent',
    'X-Requested-With',
    'Origin',
    'Referer'
  ],
  exposedHeaders: ['Content-Type', 'Content-Length'],
  optionsSuccessStatus: 200, // Important for Safari
  maxAge: 86400
}));

// Increase payload limit for large usage files (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session configuration for simple login system
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-for-testing',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize default reminder templates and rules
  setTimeout(async () => {
    try {
      const { initializeDefaultReminders } = await import('./services/reminderInitializer');
      await initializeDefaultReminders();
    } catch (error) {
      console.error('Failed to initialize reminders:', error);
    }
  }, 3000);

  // Initialize Telegram Bot if token is configured
  setTimeout(async () => {
    try {
      const { initializeBot } = await import('./telegram/bot');
      await initializeBot();
    } catch (error) {
      console.log('Telegram bot initialization skipped:', (error as Error).message);
    }
  }, 5000); // Give server time to start

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 80 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // Safari/iOS compatibility middleware for portal routes
  const safariPortalMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Add headers required for Safari/iOS compatibility
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Log for debugging iOS issues
    const userAgent = req.get('User-Agent') || '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
    
    if (isIOS || isSafari) {
      console.log(`[iOS/Safari Request] Path: ${req.path}, UA: ${userAgent.substring(0, 50)}...`);
    }
    
    next();
  };

  // Add portal routes with Safari middleware
  // Primary route for Safari (most compatible)
  app.get('/view/:username', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'safari-portal.html'));
  });

  // Alternative simple route
  app.get('/public/:username', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'simple-portal.html'));
  });

  // Mobile-optimized route
  app.get('/rep/:username', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'mobile-portal.html'));
  });

  // Keep legacy routes with Safari middleware
  app.get('/mobile-portal/:username?', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'mobile-portal.html'));
  });

  app.get('/simple-portal/:username?', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'simple-portal.html'));
  });

  // Add root-level portal route for maximum compatibility
  app.get('/p/:username', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'safari-portal.html'));
  });

  // iOS test page
  app.get('/ios-test', safariPortalMiddleware, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, '..', 'ios-test.html'));
  });

  // Health check endpoint for iOS testing
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Login-protected portal route
  app.get('/portal/:username', safariPortalMiddleware, (req, res) => {
    // Check if authenticated (simple session check)
    const isAuthenticated = (req.session as any)?.authenticated === true;
    const username = req.params.username;
    
    if (!isAuthenticated) {
      // Redirect to login page
      res.sendFile(path.resolve(import.meta.dirname, '..', 'login-portal.html'));
    } else {
      // Serve the actual portal (you can create a proper portal page here)
      res.send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پورتال نماینده ${username}</title>
            <style>
                body { font-family: Tahoma; direction: rtl; padding: 20px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; }
                h1 { color: #333; text-align: center; }
                .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .logout-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 پورتال نماینده ${username}</h1>
                <div class="success">
                    ✓ شما با موفقیت وارد پورتال شده‌اید!<br>
                    ✓ مشکل 403 Forbidden حل شده است<br>
                    ✓ احراز هویت کار می‌کند<br>
                </div>
                <p>نام نماینده: <strong>${username}</strong></p>
                <p>زمان ورود: <strong>${new Date().toLocaleString('fa-IR')}</strong></p>
                <p>آدرس: <strong>${req.get('host')}${req.originalUrl}</strong></p>
                <br>
                <button class="logout-btn" onclick="logout()">خروج از سیستم</button>
            </div>
            <script>
                function logout() {
                    fetch('/api/logout', { method: 'POST' })
                        .then(() => window.location.reload());
                }
            </script>
        </body>
        </html>
      `);
    }
  });

  // Simple login API for testing
  app.post('/api/login', express.json(), (req, res) => {
    const { username, password } = req.body;
    
    if (username === '1' && password === '2') {
      (req.session as any).authenticated = true;
      (req.session as any).username = username;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Logout API
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  process.env.PORT = process.env.PORT || '80';
  const port = parseInt(process.env.PORT, 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    log(`Portal routes available:`);
    log(`  - /portal/drmbesf (Login-protected portal)`);
    log(`  - /view/dream (Safari optimized)`);
    log(`  - /public/dream (Simple version)`);
    log(`  - /rep/dream (Mobile optimized)`);
    log(`  - /p/dream (Short URL)`);
    log(`  - /ios-test (iOS debugging)`);
  });
})();
