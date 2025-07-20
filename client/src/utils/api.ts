// API utility functions for the frontend
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export async function apiRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data; // Support both wrapped and direct responses
}