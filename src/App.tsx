import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Privacy from "./pages/Privacy";
import Partners from "./pages/Partners";
import FAQs from "./pages/FAQs";
import TermsOfService from "./pages/TermsOfService";
import AdminPanel from "./pages/AdminPanel";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import MerchantDashboard from "./pages/MerchantDashboard";
import NotFound from "./pages/NotFound";
import UserDashboard from "./pages/UserDashboard";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import AdminTestPanel from "./components/AdminTestPanel";
import AdminDebug from "./pages/AdminDebug";
import { useSmartRefresh } from "./hooks/useSmartRefresh";
import { useSessionPersistence } from "./hooks/useSessionPersistence";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false, // Prevent refetch on component mount
      refetchOnReconnect: true, // Allow refetch on network reconnect
      staleTime: 2 * 60 * 1000, // 2 minutes - shorter for fresher data
      gcTime: 10 * 60 * 1000, // 10 minutes cache
      // Smart refetch function - only refetch if data is stale
      refetchOnWindowFocus: (query) => {
        // Only refetch if the query is stale and it's been more than 30 seconds
        const now = Date.now();
        const lastFetch = query.state.dataUpdatedAt;
        const isStale = now - lastFetch > 30000; // 30 seconds
        
        if (isStale) {
          console.log('🔄 Smart refetching query:', query.queryKey);
          return true;
        }
        
        console.log('🔄 Skipping refetch, data is fresh:', query.queryKey);
        return false;
      },
    },
  },
});

const App = () => {
  const isDev = import.meta.env.DEV;
  
  // Initialize smart refresh system (prevents page refresh, allows component updates)
  useSmartRefresh();
  
  // Initialize session persistence to maintain auth state
  useSessionPersistence();

  // Dev-only debugging utilities
  useEffect(() => {
    if (isDev) {
      import('@/utils/testAdminAccess');
      import('@/utils/fixAdminUser');
    }
  }, [isDev]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Role-based dashboard routing - redirects to appropriate dashboard based on user role */}
            <Route path="/dashboard" element={<RoleBasedDashboard />} />
            {/* Keep the old dashboard route for backward compatibility if bookmarked */}
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/admin" element={<Navigate to="/admin-panel" replace />} />
            {isDev && <Route path="/admin-test" element={<AdminTestPanel />} />}
            {isDev && <Route path="/admin-debug" element={<AdminDebug />} />}
            <Route path="/merchant" element={<MerchantDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
