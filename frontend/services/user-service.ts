// frontend/services/user-service.ts

export interface User {
    user_id: number;
    username: string | null;
    full_name: string;
    active: boolean;
    language: string;
    role: 'student' | 'mentor' | 'university_admin';
    department?: string | null;
}

/**
 * Get the current user's profile
 * @returns A promise that resolves to the user profile
 */
export async function getUserProfile(): Promise<User> {
    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to fetch user profile');
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error in getUserProfile service:', error);
        throw error;
    }
}

/**
 * Update user profile settings
 * @param profileData The profile data to update
 * @returns A promise that resolves to the updated user
 */
export async function updateUserProfile(profileData: Partial<User>): Promise<User> {
    try {
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update user profile');
        }

        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Error in updateUserProfile service:', error);
        throw error;
    }
}