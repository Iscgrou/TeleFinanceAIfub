import { QueryClient } from "@tanstack/react-query";

// Define fetcher function for API calls
const apiRequest = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Request failed:', response.status, errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response for', url, ':', data);
    return data;
  } catch (error) {
    console.error('Network error for', url, ':', error);
    throw error;
  }
};

// Create query client with default fetcher
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => apiRequest(queryKey[0] as string),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export { apiRequest };