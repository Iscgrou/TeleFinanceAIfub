import { QueryClient } from '@tanstack/react-query'

// Create QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string]
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`)
        }
        return response.json()
      },
    },
  },
})

// API request helper function
export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`)
  }

  return response.json()
}