import { User } from './user-service';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    status: string;
    message?: string;
    user?: User;
    token?: string;
}

/**
 * Login function that authenticates a user with their Telegram username and password
 * @param credentials Object containing username and password
 * @returns Promise resolving to the authentication response
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        // First, ensure we're starting with a clean state
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Determine the correct API endpoint
        const endpoint = '/api/auth/login';
        console.log('Attempting login to endpoint:', endpoint);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        // Store auth token in localStorage if successful
        if (data.token) {
            console.log('Storing auth token and user data');
            localStorage.setItem('auth_token', data.token);

            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Check if redirect URL is specified in the response
            const redirectUrl = data.redirect_url || '/admin/dashboard';
            console.log('Login successful, will redirect to:', redirectUrl);

            // Set a flag to indicate we've just logged in successfully
            sessionStorage.setItem('login_success', 'true');

            // Add a small delay before redirection
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Logs out the current user
 */
export function logout(): void {
    console.log('Logging out user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('login_success');

    // Redirect to login page
    window.location.href = '/login';
}

/**
 * Checks if user is currently authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
}

/**
 * Gets the current user from localStorage
 * @returns User object or null if not authenticated
 */
export function getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Gets the authentication token
 * @returns Auth token or empty string if not authenticated
 */
export function getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
}

/**
 * Checks if the current user has the required role
 * @param requiredRole Role to check for
 * @returns Boolean indicating if user has required role
 */
export function hasRole(requiredRole: string): boolean {
    const user = getCurrentUser();
    if (!user) return false;

    // Admin has full access to everything
    if (user.role === 'university_admin') return true;

    // Otherwise check for specific role
    return user.role === requiredRole;
}

/**
 * Checks if a redirect is required after login
 * (Used in the dashboard component to handle redirects)
 */
export function checkLoginRedirect(): boolean {
    const success = sessionStorage.getItem('login_success');
    if (success === 'true') {
        // Clear the flag so it's a one-time check
        sessionStorage.removeItem('login_success');
        return true;
    }
    return false;
}

/**
 * Initialize auth - check token validity on application startup
 * Call this in your _app.js or main layout component
 */
export async function initializeAuth(): Promise<void> {
    // If we have a token, verify it
    if (isAuthenticated()) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Auth token verification failed - logging out');
                logout();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            // Don't automatically logout on network errors
        }
    }
}