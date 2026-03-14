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
  /** User's email address for authentication and communication */
  email: string;
  /** Display name for the user */
  name: string;
  /** User's role in the system for access control */
  role: 'Viewer' | 'Editor' | 'Admin';
  /** Optional profile picture URL */
  avatar?: string;
}

/**
 * Authentication state interface
 * 
 * Represents the current authentication state of the application,
 * including user data, authentication status, and session token.
 */
export interface AuthState {
  /** Current user data or null if not authenticated */
  user: User | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Authentication token for API requests */
  token: string | null;
}
