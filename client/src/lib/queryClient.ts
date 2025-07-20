import { QueryClient } from "@tanstack/react-query";

// Create query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher for React Query
export const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = queryKey[0];
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'خطای سرور' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Set default query function
queryClient.setQueryDefaults([''], { queryFn: defaultQueryFn });

// Helper function for making API requests with mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'خطای سرور' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};