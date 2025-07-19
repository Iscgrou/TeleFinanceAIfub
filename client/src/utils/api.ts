// Simple, reliable API utility
export class ApiClient {
  private baseUrl = '';

  async get<T>(endpoint: string): Promise<T> {
    try {
      console.log(`🔥 Fetching: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Success for ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`💥 Network error for ${endpoint}:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Network error for ${endpoint}:`, error);
      throw error;
    }
  }
}

export const api = new ApiClient();