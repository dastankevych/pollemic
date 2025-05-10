import { getAuthToken } from "@/services/auth-service"

interface RequestOptions extends RequestInit {
    // Add any additional options here
    requireAuth?: boolean
}

interface ApiResponse<T = any> {
    status: string
    data?: T
    message?: string
    error?: string
}

/**
 * Make an authenticated API request
 * @param url The URL to fetch
 * @param options Request options
 * @returns Promise resolving to the API response
 */
export async function apiRequest<T = any>(
    url: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    // Default to requiring authentication
    const { requireAuth = true, ...fetchOptions } = options

    // Prepare headers
    const headers = new Headers(fetchOptions.headers)

    // Set default headers
    if (!headers.has('Content-Type') && !url.includes('/upload')) {
        headers.set('Content-Type', 'application/json')
    }

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
    }

    // Add auth token if required
    if (requireAuth) {
        const token = getAuthToken()
        if (token) {
            headers.set('Authorization', `Bearer ${token}`)
        }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
        ...fetchOptions,
        headers
    }

    try {
        // Make the request
        const response = await fetch(url, requestOptions)

        // Parse JSON response if possible
        let data
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            data = await response.json()
        } else {
            data = await response.text()
        }

        // Handle successful response
        if (response.ok) {
            return {
                status: 'success',
                data,
                message: data.message
            }
        }

        // Handle error response
        return {
            status: 'error',
            error: data.message || data.detail || 'An unknown error occurred',
            message: data.message || data.detail,
            data
        }
    } catch (error) {
        // Handle network or other errors
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }
    }
}

/**
 * Make a GET request to the API
 * @param url The URL to fetch
 * @param options Request options
 * @returns Promise resolving to the API response
 */
export function get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return apiRequest<T>(url, {
        method: 'GET',
        ...options
    })
}

/**
 * Make a POST request to the API
 * @param url The URL to fetch
 * @param data The data to send
 * @param options Request options
 * @returns Promise resolving to the API response
 */
export function post<T = any>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return apiRequest<T>(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    })
}

/**
 * Make a PUT request to the API
 * @param url The URL to fetch
 * @param data The data to send
 * @param options Request options
 * @returns Promise resolving to the API response
 */
export function put<T = any>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return apiRequest<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    })
}

/**
 * Make a DELETE request to the API
 * @param url The URL to fetch
 * @param options Request options
 * @returns Promise resolving to the API response
 */
export function del<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return apiRequest<T>(url, {
        method: 'DELETE',
        ...options
    })
}