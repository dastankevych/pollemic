/**
 * User roles in the application
 */
export enum UserRole {
  STUDENT = "student",
  MENTOR = "mentor",
  UNIVERSITY_ADMIN = "university_admin"
}

/**
 * User information returned from the API
 */
export interface User {
  user_id: number;
  username: string | null;
  full_name: string;
  role: string;
}

/**
 * Authentication token response from the API
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}