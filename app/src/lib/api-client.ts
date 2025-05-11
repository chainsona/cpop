/**
 * API client for making authenticated requests
 */

/**
 * Base options for API requests
 */
interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Get the absolute URL for an API endpoint
 * Works in both browser and server environments
 */
function getAbsoluteUrl(path: string): string {
  // Check if the URL is already absolute
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // In browser environment
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  // In server environment - use env variable or default
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

/**
 * Make an authenticated API request
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  // Get the Solana auth token if available - only in browser
  let solanaToken: string | null = null;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    solanaToken = localStorage.getItem('solana_auth_token');
  }

  // Prepare the headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add the auth token if available
  if (solanaToken) {
    // Format the token correctly - don't add prefix if it already contains 'Solana'
    if (!solanaToken.startsWith('Solana ')) {
      headers['Authorization'] = `Solana ${solanaToken}`;
    } else {
      headers['Authorization'] = solanaToken;
    }
    console.log('Adding auth token to request', { url, hasToken: !!solanaToken });
  } else {
    console.log('No auth token available for request', { url });
    // For /api/poaps endpoint, set a special header to indicate it's from the My POAPs page
    if (url.includes('/api/poaps') && !url.includes('/')) {
      headers['X-POAP-View'] = 'MyPOAPs';
    }
  }

  // Make the request with the auth headers
  return fetch(getAbsoluteUrl(url), {
    ...options,
    headers,
    // Add cache control to prevent browser caching of authenticated requests
    cache: 'no-store',
  });
}

/**
 * Helper function for GET requests
 */
export async function get<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper function for POST requests
 */
export async function post<T>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper function for PUT requests
 */
export async function put<T>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper function for DELETE requests
 */
export async function del<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
