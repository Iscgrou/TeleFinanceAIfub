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

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...processedOptions,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorData;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try text
        try {
          const textError = await response.text();
          if (textError) errorMessage = textError;
        } catch (e2) {
          // Ignore text parsing errors
        }
      }
      
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.response = { data: errorData };
      throw error;
    }

    const data = await response.json();
    return data.data || data; // Support both wrapped and direct responses
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
    }
    throw error;
  }
}