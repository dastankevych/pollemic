# Authentication System Documentation

This document provides an overview of the authentication system implemented in the Pollemic application.

## Overview

The Pollemic application uses a JWT (JSON Web Token) based authentication system. The authentication flow is as follows:

1. User enters their credentials (username and password) on the login page
2. The frontend sends these credentials to the backend
3. The backend verifies the credentials and returns a JWT token
4. The frontend stores this token in localStorage
5. The token is included in all subsequent API requests
6. Protected routes check for the presence of a valid token

## Backend Implementation

### Authentication Endpoints

- `POST /auth/token`: Authenticates a user and returns a JWT token
- `GET /auth/me`: Returns information about the currently authenticated user

### JWT Token

The JWT token contains the following claims:
- `sub`: The username of the authenticated user
- `user_id`: The ID of the authenticated user
- `role`: The role of the authenticated user (student, mentor, university_admin)
- `exp`: The expiration time of the token

### Middleware

The backend uses middleware to protect routes that require authentication. This middleware:
1. Checks for the presence of an Authorization header
2. Verifies the JWT token
3. Extracts user information from the token
4. Makes this information available to route handlers

### Role-Based Access Control

Some endpoints are restricted based on the user's role. For example:
- Some endpoints are only accessible to mentors and admins
- Some endpoints are only accessible to admins

## Frontend Implementation

### Auth Context

The frontend uses a React context (`AuthContext`) to manage authentication state. This context provides:
- `user`: Information about the currently authenticated user
- `isLoading`: Whether authentication state is being loaded
- `isAuthenticated`: Whether the user is authenticated
- `login`: Function to log in a user
- `logout`: Function to log out a user
- `checkAuth`: Function to check if the user is authenticated

### Protected Routes

The `ProtectedRoute` component is used to protect routes that require authentication. This component:
1. Checks if the user is authenticated
2. If not, redirects to the login page
3. Optionally checks if the user has a specific role
4. If not, redirects to the dashboard

### API Utilities

The `api.ts` file provides utilities for making authenticated API requests:
- `fetchWithAuth`: Base function for authenticated requests
- `getWithAuth`: For GET requests
- `postWithAuth`: For POST requests
- `putWithAuth`: For PUT requests
- `deleteWithAuth`: For DELETE requests

These utilities automatically:
- Add the authentication token to requests
- Handle authentication errors
- Parse JSON responses

## Usage Examples

### Protecting a Route

```tsx
import { ProtectedRoute } from "@/components/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard content</div>
    </ProtectedRoute>
  );
}
```

### Role-Based Protection

```tsx
import { ProtectedRoute } from "@/components/protected-route";
import { UserRole } from "@/types/auth";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.UNIVERSITY_ADMIN}>
      <div>Admin content</div>
    </ProtectedRoute>
  );
}
```

### Making Authenticated API Requests

```tsx
import { getWithAuth, postWithAuth } from "@/lib/api";

// Get user data
const userData = await getWithAuth<User>("/api/auth/me");

// Create a new resource
const newResource = await postWithAuth<Resource>("/api/resources", {
  name: "New Resource",
  description: "Description"
});
```

## Security Considerations

- JWT tokens are stored in localStorage, which is vulnerable to XSS attacks
- The application should be served over HTTPS to prevent token theft
- Tokens have an expiration time to limit the window of opportunity for attackers
- The backend validates tokens on every request
- Role-based access control is enforced on both frontend and backend

## Testing

See the [Authentication Flow Test Script](../test-auth-flow.md) for detailed instructions on testing the authentication system.

## Environment Variables

The authentication system uses the following environment variables:
- `SECRET_KEY`: The secret key used to sign JWT tokens
- `ALGORITHM`: The algorithm used for JWT token signing (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: The expiration time for access tokens in minutes (default: 60)

These variables should be set in the `.env` file at the root of the project.