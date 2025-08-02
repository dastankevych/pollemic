/**
 * API client utilities for making authenticated requests
 */

/**
 * Make an authenticated API request
 * 
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns The fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  // Set up headers with authentication
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle authentication errors
  if (response.status === 401) {
    // Clear the token and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }
  
  return response;
}

/**
 * Make an authenticated GET request
 * 
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns The parsed JSON response
 */
export async function getWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated POST request
 * 
 * @param url The URL to fetch
 * @param data The data to send
 * @param options Additional fetch options
 * @returns The parsed JSON response
 */
export async function postWithAuth<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated PUT request
 * 
 * @param url The URL to fetch
 * @param data The data to send
 * @param options Additional fetch options
 * @returns The parsed JSON response
 */
export async function putWithAuth<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Make an authenticated DELETE request
 * 
 * @param url The URL to fetch
 * @param options Additional fetch options
 * @returns The parsed JSON response
 */
export async function deleteWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}