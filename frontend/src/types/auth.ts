/**
 * @fileoverview Authentication type definitions for Krok MVP
 * 
 * This file contains TypeScript type definitions for authentication-related
 * data structures used throughout the application. It defines the structure
 * for user data and authentication state.
 * 
 * @author Krok Development Team
 * @version 1.0.0
 */

/**
 * User interface representing a system user
 * 
 * Defines the structure for user data including identification,
 * contact information, role-based access control, and optional
 * profile information.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** Display name for the user */
  fullName: string;
  /** User's role in the system */
  role: 'USER' | 'ADMIN';
  /** Whether the user is active */
  isActive: boolean;
  /** When the user was created */
  createdAt?: string;
  /** Optional profile picture URL */
  avatar?: string;
}

/**
 * Authentication response from the backend
 */
export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current user data or null if not authenticated */
  user: User | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Authentication token for API requests */
  token: string | null;
}
