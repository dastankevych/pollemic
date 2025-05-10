// frontend/services/auth-service.ts

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
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        // Store auth token in localStorage if successful
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
}

/**
 * Checks if user is currently authenticated
 * @returns Boolean indicating if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
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