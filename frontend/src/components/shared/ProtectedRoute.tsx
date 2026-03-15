import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectPath = '/login' 
}) => {
  const { isAuthenticated, token } = useAuth();

  // If we have a token but state isn't synced yet, we might want a loading state
  // But AuthProvider already handles isLoading initialization

  if (!isAuthenticated || !token) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
