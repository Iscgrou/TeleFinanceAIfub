/**
 * PHASE 7.4: System Health Monitoring Component
 * نمایشگر سلامت سیستم
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Database,
  Globe,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  lastCheck: Date;
}

export function SystemHealthMonitor() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runHealthChecks = async () => {
    setIsLoading(true);
    const checks: HealthCheck[] = [];

    try {
      // API Health Check
      const apiStart = Date.now();
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const apiTime = Date.now() - apiStart;
        
        checks.push({
          name: 'API Server',
          status: response.ok ? 'healthy' : 'error',
          message: response.ok ? 'API عملیاتی است' : `خطای HTTP ${response.status}`,
          responseTime: apiTime,
          lastCheck: new Date(),
        });
      } catch (error) {
        checks.push({
          name: 'API Server',
          status: 'error',
          message: 'عدم دسترسی به API',
          lastCheck: new Date(),
        });
      }

      // Database Health Check
      const dbStart = Date.now();
      try {
        const response = await fetch('/api/representatives?limit=1');
        const dbTime = Date.now() - dbStart;
        
        checks.push({
          name: 'Database',
          status: response.ok ? 'healthy' : 'error',
          message: response.ok ? 'دیتابیس عملیاتی است' : 'مشکل در دسترسی به دیتابیس',
          responseTime: dbTime,
          lastCheck: new Date(),
        });
      } catch (error) {
        checks.push({
          name: 'Database',
          status: 'error',
          message: 'عدم دسترسی به دیتابیس',
          lastCheck: new Date(),
        });
      }

      // Alert System Health
      try {
        const response = await fetch('/api/alerts/rules');
        const alertData = await response.json();
        
        checks.push({
          name: 'Alert System',
          status: response.ok ? 'healthy' : 'warning',
          message: response.ok 
            ? `${alertData.total || 0} قانون هشدار فعال`
            : 'مشکل در سیستم هشدار',
          lastCheck: new Date(),
        });
      } catch (error) {
        checks.push({
          name: 'Alert System',
          status: 'warning',
          message: 'سیستم هشدار در دسترس نیست',
          lastCheck: new Date(),
        });
      }

      // AI Analytics Health
      try {
        const response = await fetch('/api/ai-analytics/debt-trends');
        
        checks.push({
          name: 'AI Analytics',
          status: response.ok ? 'healthy' : 'warning',
          message: response.ok ? 'تحلیلگر AI عملیاتی است' : 'مشکل در تحلیلگر AI',
          lastCheck: new Date(),
        });
      } catch (error) {
        checks.push({
          name: 'AI Analytics',
          status: 'warning',
          message: 'تحلیلگر AI در دسترس نیست',
          lastCheck: new Date(),
        });
      }

      // Browser Performance Check
      const performanceCheck = (): HealthCheck => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
          
          return {
            name: 'Browser Performance',
            status: memoryUsage > 80 ? 'warning' : 'healthy',
            message: memoryUsage > 80 
              ? `استفاده از حافظه: ${memoryUsage.toFixed(1)}% (بالا)`
              : `استفاده از حافظه: ${memoryUsage.toFixed(1)}%`,
            lastCheck: new Date(),
          };
        }
        
        return {
          name: 'Browser Performance',
          status: 'healthy',
          message: 'عملکرد مرورگر عادی است',
          lastCheck: new Date(),
        };
      };

      checks.push(performanceCheck());

      // Network Connectivity
      checks.push({
        name: 'Network',
        status: navigator.onLine ? 'healthy' : 'error',
        message: navigator.onLine ? 'اتصال اینترنت برقرار است' : 'عدم دسترسی به اینترنت',
        lastCheck: new Date(),
      });

    } catch (error) {
      console.error('Health check error:', error);
    }

    setHealthChecks(checks);
    setIsLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(runHealthChecks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">سالم</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">هشدار</Badge>;
      case 'error':
        return <Badge variant="destructive">خطا</Badge>;
    }
  };

  const overallHealth = healthChecks.length > 0 
    ? healthChecks.every(check => check.status === 'healthy')
      ? 'healthy'
      : healthChecks.some(check => check.status === 'error')
        ? 'error'
        : 'warning'
    : 'healthy';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            نمایشگر سلامت سیستم
            {getStatusBadge(overallHealth)}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={runHealthChecks}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {healthChecks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">{check.message}</div>
                  {check.responseTime && (
                    <div className="text-xs text-muted-foreground">
                      زمان پاسخ: {check.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {getStatusBadge(check.status)}
                <div className="text-xs text-muted-foreground mt-1">
                  {check.lastCheck.toLocaleTimeString('fa-IR')}
                </div>
              </div>
            </div>
          ))}
          
          {healthChecks.length === 0 && !isLoading && (
            <div className="text-center p-8 text-muted-foreground">
              در حال بررسی سلامت سیستم...
            </div>
          )}
          
          {isLoading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <div className="text-muted-foreground">در حال بررسی...</div>
            </div>
          )}
        </div>

        {/* System Overview */}
        {healthChecks.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {healthChecks.filter(c => c.status === 'healthy').length}
                </div>
                <div className="text-sm text-muted-foreground">سیستم سالم</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {healthChecks.filter(c => c.status === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">هشدار</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {healthChecks.filter(c => c.status === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">خطا</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {((healthChecks.filter(c => c.status === 'healthy').length / healthChecks.length) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">سلامت کل</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}