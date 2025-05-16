export function syncAuthState(): void {
  if (typeof window === 'undefined') {
    return; // Only run in browser
  }

  // Check if token exists in localStorage
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');

  if (token) {
    // Sync to cookies for middleware access
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`; // 7 days

    // If we have user data, also store a simplified version in cookie
    if (user) {
      try {
        const userData = JSON.parse(user);
        const simplifiedUser = {
          id: userData.user_id,
          role: userData.role
        };
        document.cookie = `user_data=${JSON.stringify(simplifiedUser)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  } else {
    // If no token in localStorage, check cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // If token in cookies but not localStorage, sync to localStorage
    if (cookies.auth_token) {
      localStorage.setItem('auth_token', cookies.auth_token);

      // Try to restore user data if available
      if (cookies.user_data) {
        try {
          const cookieUserData = JSON.parse(decodeURIComponent(cookies.user_data));
          const storedUser = {
            user_id: cookieUserData.id,
            role: cookieUserData.role,
            username: 'restored_user', // Placeholder
            full_name: 'Restored User', // Placeholder
            active: true
          };
          localStorage.setItem('user', JSON.stringify(storedUser));
        } catch (e) {
          console.error('Error restoring user data from cookie', e);
        }
      }
    } else {
      // No token anywhere, clear cookies
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'user_data=; path=/; max-age=0';
    }
  }
}

/**
 * Clear all authentication data from both localStorage and cookies
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') {
    return; // Only run in browser
  }

  // Clear localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');

  // Clear cookies
  document.cookie = 'auth_token=; path=/; max-age=0';
  document.cookie = 'user_data=; path=/; max-age=0';
}

// Initialize sync on load
if (typeof window !== 'undefined') {
  // Run on initial load
  syncAuthState();

  // Set up interval to periodically sync (useful for multiple tabs)
  setInterval(syncAuthState, 60000); // Every minute

  // Also sync on storage events (when localStorage changes in another tab)
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth_token' || event.key === 'user') {
      syncAuthState();
    }
  });
}