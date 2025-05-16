import { getAuthToken, getCurrentUser } from "@/services/auth-service";

/**
 * Debug utility for authentication issues
 * This helps diagnose authentication problems by checking local storage,
 * token validity, and API accessibility
 */
export async function debugAuthIssues(): Promise<{
  status: string;
  details: Record<string, any>;
  recommendations: string[];
}> {
  try {
    const authToken = getAuthToken();
    const currentUser = getCurrentUser();

    const details: Record<string, any> = {
      hasAuthToken: !!authToken,
      hasUserInStorage: !!currentUser,
      tokenDetails: null,
      verifyEndpointStatus: null,
      meEndpointStatus: null,
    };

    const recommendations: string[] = [];

    // Check if token exists but is malformed or expired
    if (authToken) {
      try {
        // Basic token structure check (not full validation)
        const tokenParts = authToken.split('.');
        if (tokenParts.length !== 3) {
          details.tokenDetails = { error: 'Token format is invalid' };
          recommendations.push('Token is malformed. Try clearing browser data and logging in again.');
        } else {
          try {
            // Try to decode payload (middle part)
            const payload = JSON.parse(atob(tokenParts[1]));
            details.tokenDetails = {
              exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
              isExpired: payload.exp ? payload.exp * 1000 < Date.now() : 'Cannot determine',
              sub: payload.sub,
              user_id: payload.user_id,
              role: payload.role
            };

            if (payload.exp && payload.exp * 1000 < Date.now()) {
              recommendations.push('Token has expired. Please log in again.');
            }
          } catch (e) {
            details.tokenDetails = { error: 'Could not decode token payload' };
            recommendations.push('Token payload cannot be decoded. Try logging in again.');
          }
        }
      } catch (e) {
        details.tokenDetails = { error: 'Error analyzing token' };
      }
    } else {
      recommendations.push('No authentication token found. Please log in.');
    }

    // Test auth endpoints if we have a token
    if (authToken) {
      try {
        // Test /auth/verify endpoint
        const verifyResponse = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
          }
        });
        details.verifyEndpointStatus = {
          status: verifyResponse.status,
          ok: verifyResponse.ok
        };

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          details.verifyEndpointStatus.data = verifyData;
        } else {
          recommendations.push('Token verification failed. Your session may have expired.');
        }
      } catch (e) {
        details.verifyEndpointStatus = { error: 'Network error testing verify endpoint' };
        recommendations.push('Network error when verifying authentication. Check your connection.');
      }

      try {
        // Test /auth/me endpoint
        const meResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json'
          }
        });
        details.meEndpointStatus = {
          status: meResponse.status,
          ok: meResponse.ok
        };

        if (meResponse.ok) {
          const meData = await meResponse.json();
          details.meEndpointStatus.data = meData;
        } else {
          recommendations.push('User profile endpoint failed. Your session may have expired.');
        }
      } catch (e) {
        details.meEndpointStatus = { error: 'Network error testing me endpoint' };
      }
    }

    // Verify token and user data consistency
    if (authToken && currentUser) {
      if (details.tokenDetails?.user_id && details.tokenDetails.user_id !== currentUser.user_id) {
        recommendations.push('User ID mismatch between token and stored user. This suggests data inconsistency.');
      }
    }

    // API endpoint checks
    if (details.verifyEndpointStatus?.status === 404 || details.meEndpointStatus?.status === 404) {
      recommendations.push('Authentication endpoints not found. Check API URL configuration.');
    }

    if (!recommendations.length && authToken) {
      // If we have a token but can't access the endpoints
      if ((!details.verifyEndpointStatus?.ok || !details.meEndpointStatus?.ok) &&
          (details.verifyEndpointStatus?.status !== 404 && details.meEndpointStatus?.status !== 404)) {
        recommendations.push('Authentication seems valid but API access is failing. This may be a CORS or network issue.');
      }
    }

    return {
      status: recommendations.length > 0 ? 'issues_found' : 'authenticated',
      details,
      recommendations
    };
  } catch (error) {
    return {
      status: 'error',
      details: { error: String(error) },
      recommendations: ['An error occurred while debugging. Try clearing your browser data and reloading.']
    };
  }
}

/**
 * Fix common authentication issues automatically
 */
export async function fixAuthIssues(): Promise<{
  fixed: boolean;
  action: string;
  message: string
}> {
  try {
    const debugResult = await debugAuthIssues();

    if (debugResult.status === 'authenticated') {
      return {
        fixed: true,
        action: 'none',
        message: 'No issues detected with authentication'
      };
    }

    const hasExpiredToken = debugResult.details.tokenDetails?.isExpired === true;
    const hasInvalidToken = debugResult.details.tokenDetails?.error !== undefined;

    // Clear storage and redirect to login if token is invalid or expired
    if (!debugResult.details.hasAuthToken || hasExpiredToken || hasInvalidToken) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');

      return {
        fixed: true,
        action: 'redirect_to_login',
        message: 'Authentication data was cleared. Redirecting to login page.'
      };
    }

    // If we have API mismatches or configuration issues
    if (debugResult.details.verifyEndpointStatus?.status === 404 ||
        debugResult.details.meEndpointStatus?.status === 404) {
      return {
        fixed: false,
        action: 'configuration_issue',
        message: 'API configuration issue detected. Please check API URL configuration.'
      };
    }

    return {
      fixed: false,
      action: 'manual_intervention',
      message: 'Authentication issues require manual intervention. Please logout and login again.'
    };
  } catch (error) {
    return {
      fixed: false,
      action: 'error',
      message: `Error while attempting to fix auth issues: ${String(error)}`
    };
  }
}