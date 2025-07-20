/**
 * PHASE 7.1: Performance Monitoring Component
 * نمایش عملکرد سیستم در محیط توسعه
 */

import { useState, useEffect } from 'react';
import { usePerformanceMetrics, useMemoryMonitor, useBundleAnalyzer } from '@/hooks/usePerformanceOptimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, HardDrive, Package, Clock, AlertTriangle } from 'lucide-react';

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const metrics = usePerformanceMetrics();
  const { memoryInfo, memoryUsagePercentage, isHighMemoryUsage } = useMemoryMonitor();
  const bundleInfo = useBundleAnalyzer();

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  if (!isVisible) return null;

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatTime = (time: number) => {
    return time.toFixed(2) + ' ms';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            {isHighMemoryUsage && (
              <Badge variant="destructive" className="text-xs">
                High Memory
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Page Load Metrics */}
          {metrics.pageLoadTime && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Page Load
              </span>
              <Badge variant="outline" className="text-xs">
                {formatTime(metrics.pageLoadTime)}
              </Badge>
            </div>
          )}

          {metrics.firstContentfulPaint && (
            <div className="flex items-center justify-between">
              <span>FCP</span>
              <Badge variant="outline" className="text-xs">
                {formatTime(metrics.firstContentfulPaint)}
              </Badge>
            </div>
          )}

          {/* Memory Usage */}
          {memoryInfo.usedJSHeapSize && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Memory
                </span>
                <Badge 
                  variant={isHighMemoryUsage ? "destructive" : "outline"} 
                  className="text-xs"
                >
                  {memoryUsagePercentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit || 0)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    isHighMemoryUsage ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${memoryUsagePercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Bundle Info */}
          {bundleInfo.loadedModules && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Modules
              </span>
              <Badge variant="outline" className="text-xs">
                {bundleInfo.loadedModules}
              </Badge>
            </div>
          )}

          {/* Performance Warnings */}
          {(isHighMemoryUsage || (metrics.pageLoadTime && metrics.pageLoadTime > 3000)) && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
              <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                Performance Alert
              </div>
              <div className="text-yellow-600 dark:text-yellow-300 mt-1">
                {isHighMemoryUsage && "High memory usage detected"}
                {metrics.pageLoadTime && metrics.pageLoadTime > 3000 && "Slow page load time"}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6"
              onClick={() => {
                if ('gc' in window && typeof window.gc === 'function') {
                  window.gc();
                }
              }}
            >
              GC
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6"
              onClick={() => location.reload()}
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}