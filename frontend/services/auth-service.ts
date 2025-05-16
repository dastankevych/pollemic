import { User } from './user-service';
import { syncAuthState, clearAuthState } from '@/lib/auth-sync';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        // First, ensure we're starting with a clean state
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        const response = await fetch(`${API_URL}/auth/login`, {
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
            throw new Error(data.detail || data.message || 'Authentication failed');
        }

        // Store auth token and user data if successful
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            syncAuthState(); // Sync with cookies
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export function logout(): void {
    clearAuthState();
}

export function getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
}

export function getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
    const token = getAuthToken();
    const user = getCurrentUser();
    return !!token && !!user;
}

export async function initializeAuth(): Promise<void> {
    if (isAuthenticated()) {
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
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
            logout();
        }
    }
}