# Authentication Flow

This document outlines the steps to manually test the authentication flow in the Pollemic application.

## Prerequisites

1. The application should be running locally with all services (frontend, api, database, reverse-proxy)
2. The application, should have only 2 levels of access:
   - A regular user (mentor role)
   - An admin user (university_admin role)

### 1. Login Functionality

#### 1.1 Successful Login

1. Navigate to the login page (`/login`)
2. Enter valid credentials for a regular user (telegram nickname without @ and password)
3. Click the "Login" button
4. **Expected Result**: 
   - You should be redirected to the dashboard
   - The header should show your username
   - A success toast should appear

#### 1.2 Failed Login

1. Navigate to the login page (`/login`)
2. Enter invalid credentials (wrong username or password)
3. Click the "Login" button
4. **Expected Result**: 
   - You should remain on the login page
   - An error toast should appear with different cases:
     - a wrong сredentials in case of a wrong password or nickname
     - an internal error in case 500 status code
   - The form should be reset to allow the user to try again, the input fields should become red.

#### 1.3 Redirect When Already Authenticated

1. Login successfully
2. Navigate to the login page (`/login`)
3. **Expected Result**: 
   - You should be automatically redirected to the dashboard

### 2. Protected Routes

#### 2.1 Access Protected Pages and api routes when Authenticated

1. Login successfully
2. Navigate to the dashboard (`/dashboard`)
3. **Expected Result**: 
   - You should see the dashboard content
   - The header should show your username

The same behavior should be on the pages:
"/dashboard/results"
"/dashboard/schedule"
"/dashboard/surveys"
"/dashboard/surveys/create"

the only "/" and "/login" should be open for anyone.

#### 2.2 Access Protected Page When Not Authenticated

1. Logout or clear localStorage
2. Navigate to the dashboard (`/dashboard`)
3. **Expected Result**: 
   - You should be redirected to the login page

The same behavior should be on the pages:
"/dashboard/results"
"/dashboard/schedule"
"/dashboard/surveys"
"/dashboard/surveys/create"


### 3. Logout Functionality

#### 3.1 Logout

1. Login successfully
2. Click the user menu in the header
3. Click "Log out"
4. **Expected Result**: 
   - You should be redirected to the login page
   - The localStorage should not contain a token
   - Attempting to access protected routes should redirect to login

### 4. Managing users' credentials functionality

1. Registration must be performed using the existing script in the root "add_user.py"
2. Updating password must be performed using the existing script in the root "update_password.py"

## Troubleshooting

If any test fails, check the following:

1. Browser console for JavaScript errors
2. Network tab for API request/response issues
3. Application tab > Local Storage to verify token storage
4. Backend logs for server-side errors

## Notes

- The authentication flow uses JWT tokens stored in localStorage
- Tokens expire after the time specified in the AUTH_TOKEN_EXPIRE_MINUTES environment variable
- Every static variable must load from .env using standard variable environment loader 
- Role-based access control is enforced both on the frontend and backend