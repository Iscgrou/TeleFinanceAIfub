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
  // If body exists and is an object (but not FormData), stringify it
  const processedOptions = {
    ...options,
    body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body) 
      : options.body
  };

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...processedOptions,
  });

  if (!response.ok) {
    let error: any = new Error(`HTTP error! status: ${response.status}`);
    try {
      const errorData = await response.json();
      error.response = { data: errorData };
    } catch (e) {
      // If response is not JSON, ignore
    }
    throw error;
  }

  const data = await response.json();
  return data.data || data; // Support both wrapped and direct responses
}