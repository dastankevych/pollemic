interface EndpointTest {
  endpoint: string;
  name: string;
  requiresAuth: boolean;
}

interface DiagnosticResult {
  status: 'success' | 'partial' | 'failure';
  results: {
    endpoint: string;
    name: string;
    success: boolean;
    status?: number;
    error?: string;
    latency?: number;
  }[];
  apiBaseUrl: string | null;
  corsIssue: boolean;
  connectionIssue: boolean;
  authIssue: boolean;
  summary: string;
}

/**
 * Run network diagnostics to check API connectivity
 */
export async function runNetworkDiagnostics(): Promise<DiagnosticResult> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

  // List of endpoints to test
  const endpoints: EndpointTest[] = [
    { endpoint: '/', name: 'Root endpoint', requiresAuth: false },
    { endpoint: '/api/auth/login', name: 'Login endpoint', requiresAuth: false },
    { endpoint: '/api/auth/verify', name: 'Auth verification', requiresAuth: true },
    { endpoint: '/api/questionnaires', name: 'Questionnaires API', requiresAuth: true },
    { endpoint: '/api/groups', name: 'Groups API', requiresAuth: true },
  ];

  const results = [];
  let authIssue = false;
  let corsIssue = false;
  let connectionIssue = false;

  for (const endpoint of endpoints) {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (endpoint.requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const startTime = performance.now();
      const response = await fetch(
        `${apiBaseUrl}${endpoint.endpoint}`,
        {
          method: 'GET',
          headers,
          // Set a shorter timeout
          signal: AbortSignal.timeout(5000)
        }
      );
      const endTime = performance.now();

      results.push({
        endpoint: endpoint.endpoint,
        name: endpoint.name,
        success: response.status < 500, // Consider anything below 500 as "reachable"
        status: response.status,
        latency: Math.round(endTime - startTime)
      });

      // Check for auth issues
      if (endpoint.requiresAuth && response.status === 401) {
        authIssue = true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      results.push({
        endpoint: endpoint.endpoint,
        name: endpoint.name,
        success: false,
        error: errorMessage
      });

      // Check for CORS errors
      if (errorMessage.includes('CORS') ||
          errorMessage.includes('blocked by CORS policy')) {
        corsIssue = true;
      }

      // Check for connection errors
      if (errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('timeout')) {
        connectionIssue = true;
      }
    }
  }

  // Determine overall status
  const successCount = results.filter(r => r.success).length;
  const status =
    successCount === endpoints.length ? 'success' :
    successCount > 0 ? 'partial' : 'failure';

  // Create summary message
  let summary = '';
  if (status === 'success') {
    summary = 'All API endpoints are accessible.';
  } else if (status === 'partial') {
    summary = `${successCount} of ${endpoints.length} API endpoints are accessible.`;

    if (authIssue) {
      summary += ' Authentication issues detected.';
    }

    if (corsIssue) {
      summary += ' CORS issues detected.';
    }

    if (connectionIssue) {
      summary += ' Network connectivity issues detected.';
    }
  } else {
    summary = 'Unable to connect to any API endpoints.';

    if (corsIssue) {
      summary += ' CORS policy is blocking requests.';
    }

    if (connectionIssue) {
      summary += ' Network connectivity issues detected.';
    }
  }

  return {
    status,
    results,
    apiBaseUrl,
    corsIssue,
    connectionIssue,
    authIssue,
    summary
  };
}

/**
 * Test a specific API endpoint
 * @param endpoint The endpoint to test
 * @param requiresAuth Whether the endpoint requires authentication
 */
export async function testEndpoint(
  endpoint: string,
  requiresAuth: boolean = false
): Promise<{
  success: boolean;
  status?: number;
  error?: string;
  latency?: number;
  data?: any;
}> {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (requiresAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    const response = await fetch(
      `${apiBaseUrl}${endpoint}`,
      {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
      }
    );
    const endTime = performance.now();

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      latency: Math.round(endTime - startTime),
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}