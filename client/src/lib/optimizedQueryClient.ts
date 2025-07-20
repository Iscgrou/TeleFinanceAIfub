/**
 * PHASE 7.2: Optimized Query Client Configuration
 * پیکربندی بهینه شده کلاینت جستجو
 */

import { QueryClient } from '@tanstack/react-query';

// Enhanced query client with performance optimizations
export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time optimization - data stays fresh longer
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time optimization - keep data in cache longer
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.includes('4')) return false;
        return failureCount < 2;
      },
      
      // Network mode optimization
      networkMode: 'online',
      
      // Refetch optimization
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      
      // Performance meta tags
      meta: {
        persist: true,
      },
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

// Query key factories for consistent caching
export const queryKeys = {
  // Representatives
  representatives: {
    all: ['representatives'] as const,
    lists: () => [...queryKeys.representatives.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.representatives.lists(), { filters }] as const,
    details: () => [...queryKeys.representatives.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.representatives.details(), id] as const,
  },
  
  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.invoices.lists(), { filters }] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.invoices.details(), id] as const,
    history: (filters: Record<string, any>) => [...queryKeys.invoices.all, 'history', { filters }] as const,
  },
  
  // AI Analytics
  aiAnalytics: {
    all: ['ai-analytics'] as const,
    debtTrends: () => [...queryKeys.aiAnalytics.all, 'debt-trends'] as const,
    riskAnalysis: () => [...queryKeys.aiAnalytics.all, 'risk-analysis'] as const,
    predictions: () => [...queryKeys.aiAnalytics.all, 'predictions'] as const,
    recommendations: () => [...queryKeys.aiAnalytics.all, 'recommendations'] as const,
  },
  
  // Alert System
  alerts: {
    all: ['alerts'] as const,
    rules: () => [...queryKeys.alerts.all, 'rules'] as const,
    live: () => [...queryKeys.alerts.all, 'live'] as const,
    history: (filters: Record<string, any>) => [...queryKeys.alerts.all, 'history', { filters }] as const,
  },
  
  // Sales Colleagues
  colleagues: {
    all: ['colleagues'] as const,
    lists: () => [...queryKeys.colleagues.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.colleagues.lists(), { filters }] as const,
    details: () => [...queryKeys.colleagues.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.colleagues.details(), id] as const,
  },
} as const;

// Prefetch critical data function
export async function prefetchCriticalData() {
  const promises = [
    // Prefetch recent representatives
    optimizedQueryClient.prefetchQuery({
      queryKey: queryKeys.representatives.list({ limit: 50 }),
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
    
    // Prefetch recent invoices
    optimizedQueryClient.prefetchQuery({
      queryKey: queryKeys.invoices.list({ limit: 20, sort: 'created_at', order: 'desc' }),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
    
    // Prefetch alert rules
    optimizedQueryClient.prefetchQuery({
      queryKey: queryKeys.alerts.rules(),
      staleTime: 15 * 60 * 1000, // 15 minutes
    }),
  ];
  
  try {
    await Promise.all(promises);
    console.log('✅ Critical data prefetched successfully');
  } catch (error) {
    console.warn('⚠️ Some prefetch operations failed:', error);
  }
}

// Cache invalidation helpers
export const invalidateQueries = {
  representatives: () => {
    optimizedQueryClient.invalidateQueries({ 
      queryKey: queryKeys.representatives.all 
    });
  },
  
  invoices: () => {
    optimizedQueryClient.invalidateQueries({ 
      queryKey: queryKeys.invoices.all 
    });
  },
  
  aiAnalytics: () => {
    optimizedQueryClient.invalidateQueries({ 
      queryKey: queryKeys.aiAnalytics.all 
    });
  },
  
  alerts: () => {
    optimizedQueryClient.invalidateQueries({ 
      queryKey: queryKeys.alerts.all 
    });
  },
  
  colleagues: () => {
    optimizedQueryClient.invalidateQueries({ 
      queryKey: queryKeys.colleagues.all 
    });
  },
  
  all: () => {
    optimizedQueryClient.invalidateQueries();
  },
};

// Background cache management
export function setupBackgroundCacheManagement() {
  // Clean up stale queries every 5 minutes
  setInterval(() => {
    optimizedQueryClient.removeQueries({
      predicate: (query) => {
        const { dataUpdatedAt, meta } = query.state;
        const isStale = Date.now() - dataUpdatedAt > 30 * 60 * 1000; // 30 minutes
        const isPersistent = meta?.persist;
        
        // Keep persistent queries, remove stale non-persistent ones
        return isStale && !isPersistent;
      },
    });
  }, 5 * 60 * 1000);
  
  // Prefetch critical data periodically
  setInterval(() => {
    if (navigator.onLine) {
      prefetchCriticalData();
    }
  }, 15 * 60 * 1000); // Every 15 minutes
}

// Performance monitoring for queries
export function logQueryPerformance() {
  let queryCount = 0;
  let errorCount = 0;
  
  optimizedQueryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'queryAdded') {
      queryCount++;
    }
    
    if (event.type === 'queryUpdated' && event.query.state.error) {
      errorCount++;
    }
    
    // Log stats every 100 queries in development
    if (process.env.NODE_ENV === 'development' && queryCount % 100 === 0) {
      console.log(`📊 Query Stats: ${queryCount} total, ${errorCount} errors, ${
        ((queryCount - errorCount) / queryCount * 100).toFixed(1)
      }% success rate`);
    }
  });
}