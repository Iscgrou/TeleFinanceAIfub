import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Essential for Replit deployments - trust proxy
app.set('trust proxy', true);

// Safari-compatible CORS configuration (no wildcards)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all replit domains and common testing domains
    const allowedOrigins = [
      /\.replit\.dev$/,
      /\.repl\.co$/,
      /localhost:\d+$/,
      /127\.0\.0\.1:\d+$/,
      /0\.0\.0\.0:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => 
      typeof pattern.test === 'function' ? pattern.test(origin) : pattern === origin
    );
    
    callback(null, isAllowed || origin.includes('replit'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language', 'Accept-Encoding', 'User-Agent', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Increase payload limit for large usage files (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

  // Telegram bot initialization is disabled to prevent 409 conflicts
  // Use /api/test/telegram/restart-bot endpoint to manually start the bot when needed
  console.log('Telegram bot auto-initialization disabled. Use /api/test/telegram/restart-bot to start manually.');

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
  // Add portal routes before vite setup with Safari compatibility
  // Primary route for Safari (most compatible)
  app.get('/view/:username', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(import.meta.dirname, '..', 'safari-portal.html'));
  });

  // Alternative simple route
  app.get('/public/:username', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(import.meta.dirname, '..', 'simple-portal.html'));
  });

  // Mobile-optimized route
  app.get('/rep/:username', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(import.meta.dirname, '..', 'mobile-portal.html'));
  });

  // Keep legacy routes
  app.get('/mobile-portal/:username?', (req, res) => {
    const username = req.params.username || 'demo';
    res.sendFile(path.resolve(import.meta.dirname, '..', 'mobile-portal.html'));
  });

  app.get('/simple-portal/:username?', (req, res) => {
    const username = req.params.username || 'demo';
    res.sendFile(path.resolve(import.meta.dirname, '..', 'simple-portal.html'));
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
    log(`  - /view/dream (Safari optimized)`);
    log(`  - /public/dream (Simple version)`);
    log(`  - /rep/dream (Mobile optimized)`);
    log(`  - /portal/dream (Full React version)`);
  });
})();
