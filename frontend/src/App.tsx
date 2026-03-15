/**
 * - Tooltip provider
 * 
 * @author Krok Development Team
 * @version 1.0.0
 */

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActionProvider } from "@/contexts/ActionContext";
import { PipelineProvider } from "@/contexts/PipelineContext";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Actions from "./pages/Actions";
import Home from "./pages/Home";
import Capabilities from "./pages/Capabilities";
import Pipelines from "./pages/Pipelines";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";

/**
 * QueryClient instance for managing server state
 */
const queryClient = new QueryClient();

/**
 * AppRoutes component
 * 
 * Defines the routing structure for the application.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Main Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="actions" element={<Actions />} />
          <Route path="capabilities" element={<Capabilities />} />
          <Route path="pipelines" element={<Pipelines />} />
        </Route>
      </Route>

      {/* 404 page for unmatched routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

/**
 * Main App component
 * 
 * Root component that wraps the entire application with necessary providers:
 * - QueryClientProvider: For data fetching and caching
 * - AuthProvider: For authentication state management
 * - TooltipProvider: For tooltip functionality
 * - Toaster: For toast notifications
 * - BrowserRouter: For client-side routing
 * 
 * @returns JSX.Element - The complete application structure
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ActionProvider>
          <PipelineProvider>
            {/* Toast notification system configuration */}
            <Toaster
              position="top-right"
              theme="light"
              duration={3500}
              closeButton
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#222',
                  borderRadius: '10px',
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                  fontSize: '1rem',
                  fontWeight: 500,
                  border: '1px solid #e5e7eb',
                },
              }}
            />
            {/* Router with basename for deployment path */}
            <BrowserRouter basename="/">
              <AppRoutes />
            </BrowserRouter>
          </PipelineProvider>
        </ActionProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
