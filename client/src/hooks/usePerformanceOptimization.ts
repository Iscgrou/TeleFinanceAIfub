/**
 * PHASE 7.1: Performance Optimization Hook
 * هوک بهینه‌سازی عملکرد
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Debounced search hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtualization hook for large lists
export function useVirtualization(
  itemCount: number,
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      itemCount
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    handleScroll,
    totalHeight: itemCount * itemHeight,
  };
}

// Optimized query cache management
export function useOptimizedCache() {
  const queryClient = useQueryClient();

  // Intelligent cache cleanup
  const cleanupStaleQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        // Remove queries older than 10 minutes
        return Date.now() - query.state.dataUpdatedAt > 10 * 60 * 1000;
      },
    });
  }, [queryClient]);

  // Prefetch critical data
  const prefetchCriticalData = useCallback(async () => {
    // Prefetch representatives data
    queryClient.prefetchQuery({
      queryKey: ['/api/representatives'],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Prefetch recent invoices
    queryClient.prefetchQuery({
      queryKey: ['/api/invoices', { limit: 50 }],
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient]);

  useEffect(() => {
    // Setup periodic cleanup
    const cleanup = setInterval(cleanupStaleQueries, 5 * 60 * 1000); // Every 5 minutes
    
    // Initial prefetch
    prefetchCriticalData();

    return () => clearInterval(cleanup);
  }, [cleanupStaleQueries, prefetchCriticalData]);

  return {
    cleanupStaleQueries,
    prefetchCriticalData,
  };
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercentage = useMemo(() => {
    if (memoryInfo.usedJSHeapSize && memoryInfo.jsHeapSizeLimit) {
      return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    }
    return 0;
  }, [memoryInfo]);

  return {
    memoryInfo,
    memoryUsagePercentage,
    isHighMemoryUsage: memoryUsagePercentage > 80,
  };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// Performance metrics tracking
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<{
    pageLoadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  }>({});

  useEffect(() => {
    // Get navigation timing
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      setMetrics(prev => ({
        ...prev,
        pageLoadTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
      }));
    }

    // Get paint timing
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({
            ...prev,
            firstContentfulPaint: entry.startTime,
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
}

// Bundle size analyzer (development only)
export function useBundleAnalyzer() {
  const [bundleInfo, setBundleInfo] = useState<{
    estimatedSize?: number;
    loadedModules?: number;
  }>({});

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Estimate bundle size based on loaded scripts
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;

      scripts.forEach(script => {
        // This is a rough estimation
        totalSize += (script as HTMLScriptElement).src.length;
      });

      setBundleInfo({
        estimatedSize: totalSize,
        loadedModules: scripts.length,
      });
    }
  }, []);

  return bundleInfo;
}