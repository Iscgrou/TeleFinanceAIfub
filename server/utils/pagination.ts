// Pagination utilities for scalable data handling
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

export class PaginationHelper {
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;

  static validateParams(params: PaginationParams): Required<PaginationParams> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(
      this.MAX_LIMIT,
      Math.max(1, params.limit || this.DEFAULT_LIMIT)
    );
    
    return {
      page,
      limit,
      sortBy: params.sortBy || 'id',
      sortOrder: params.sortOrder || 'desc',
      search: params.search || ''
    };
  }

  static buildResponse<T>(
    data: T[],
    totalItems: number,
    params: Required<PaginationParams>
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / params.limit);
    
    return {
      data,
      pagination: {
        currentPage: params.page,
        totalPages,
        totalItems,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
        limit: params.limit
      }
    };
  }

  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}

// Performance monitoring for large datasets
export class PerformanceMonitor {
  static async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`📊 Query ${queryName} completed in ${duration.toFixed(2)}ms`);
      
      // Alert for slow queries (>5 seconds)
      if (duration > 5000) {
        console.warn(`⚠️ Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}