/**
 * @fileoverview Authentication context for Krok MVP
 * 
 * This context provides authentication state management throughout the application.
 * It handles user authentication, session management, and user data updates.
 * Currently implements a mock authentication system for development purposes.
 * 
 * Features:
 * - User authentication state management
 * - Mock login/logout functionality
 * - User data persistence in localStorage
 * - User profile updates
 * - Automatic authentication for development
 * 
 * @author Krok Development Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';

/**
 * Extended authentication context type that includes authentication methods
 */
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

/**
 * Authentication context for managing user authentication state
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Mock user data for development purposes
 * In production, this would be replaced with real user authentication
 */
const mockUser: User = {
  id: '1',
  email: 'admin@krokos.com',
  name: 'Администратор',
  role: 'Admin'
};

/**
 * AuthProvider component
 * 
 * Provides authentication context to the application. Manages user
 * authentication state, login/logout functionality, and user data updates.
 * Currently implements a mock authentication system for development.
 * 
 * @param children - React children components
 * @returns JSX.Element - Authentication context provider
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Authentication state including user data, authentication status, and token
   */
  const [authState, setAuthState] = useState<AuthState>({
    user: mockUser,
    isAuthenticated: true,
    token: 'mock_jwt_token'
  });

  /**
   * Initialize authentication state on component mount
   * Automatically authenticates the user for development purposes
   */
  useEffect(() => {
    // Automatically authenticate user as Admin for development
    const token = 'mock_jwt_token';
    setAuthState({
      user: mockUser,
      isAuthenticated: true,
      token
    });
    
    // Persist authentication data to localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(mockUser));
  }, []);

  /**
   * Mock login function
   * 
   * In a real application, this would validate credentials against
   * a backend service. Currently returns true for development.
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise<boolean> - Always returns true for mock authentication
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    // Always return true for mock authentication
    return true;
  };

  /**
   * Mock logout function
   * 
   * In a real application, this would clear the session and redirect
   * to login. Currently re-authenticates immediately for development.
   */
  const logout = () => {
    // Re-authenticate immediately for development purposes
    const token = 'mock_jwt_token';
    setAuthState({
      user: mockUser,
      isAuthenticated: true,
      token
    });
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(mockUser));
  };

  /**
   * Updates user profile data
   * 
   * @param userData - Partial user data to update
   */
  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * Provides access to authentication state and methods throughout the application.
 * Must be used within an AuthProvider component.
 * 
 * @returns AuthContextType - Authentication context value
 * @throws Error - If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
