/**
 * PHASE 7.1: Lazy Loading Component Wrapper
 * بارگذاری تنبل اجزای سنگین
 */

import { lazy, Suspense, useState, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformanceOptimization';
import { useRef } from 'react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function LazyLoadWrapper({ 
  children, 
  fallback = <LazyLoadingSkeleton />, 
  threshold = 0.1,
  rootMargin = '50px',
  once = true 
}: LazyLoadWrapperProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const isIntersecting = useIntersectionObserver(ref, {
    threshold,
    rootMargin,
  });

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  return (
    <div ref={ref} className="min-h-[100px]">
      {(hasLoaded || !once) ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

function LazyLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="flex space-x-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  );
}

// Lazy load heavy dashboard components
export const LazyAIAnalytics = lazy(() => import('@/pages/AIAnalytics'));
export const LazyAlertManagement = lazy(() => import('@/pages/dashboard/AlertManagement'));
export const LazyInvoiceHistoryV2 = lazy(() => import('@/pages/InvoiceHistoryV2'));
export const LazySettings = lazy(() => import('@/pages/SettingsPage'));