import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { log } from "@/lib/logger";
import Index from "./pages/Index";
import Privacy from "./pages/Privacy";
import Partners from "./pages/Partners";
import FAQs from "./pages/FAQs";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import HelpCenter from "./pages/HelpCenter";
import AdminPanel from "./pages/AdminPanel";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import MerchantDashboard from "./pages/MerchantDashboard";
import NotFound from "./pages/NotFound";
import UserDashboard from "./pages/UserDashboard";
import UserDashboardSimple from "./pages/UserDashboardSimple";
import UserDashboardEnhanced from "./pages/UserDashboardEnhanced";
import UserDashboardWithBackgrounds from "./pages/UserDashboardWithBackgrounds";
import TestBackgrounds from "./pages/TestBackgrounds";
import SimpleTest from "./pages/SimpleTest";
import FuturisticDashboard from "./pages/FuturisticDashboard";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminTestPanel from "./components/AdminTestPanel";
import AdminDebug from "./pages/AdminDebug";
import DAODashboard from "./pages/DAODashboard";
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage";
import ExclusiveBenefitsPage from "./pages/ExclusiveBenefitsPage";
import UserDAODashboard from "./pages/UserDAODashboard";
import TestPage from "./pages/TestPage";
import Marketplace from "./pages/Marketplace";
import AuthPopupTest from "./pages/AuthPopupTest";
import { useSessionPersistence } from "./hooks/useSessionPersistence";
import { useInactivityLogout } from "./hooks/useInactivityLogout";
import { BackgroundJobService } from "./lib/backgroundJobs";
import ContactChatbot from "@/components/ContactChatbot";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('App Error Boundary caught an error', error, errorInfo, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">Error Details</summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
          log.debug('Smart refetching query', { queryKey: query.queryKey }, 'QueryClient');
          return true;
        }
        
        log.debug('Skipping refetch, data is fresh', { queryKey: query.queryKey }, 'QueryClient');
        return false;
      },
    },
  },
});

const App = () => {
  const isDev = import.meta.env.DEV;
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session persistence to maintain auth state
  useSessionPersistence();

  // Initialize inactivity logout (5-minute timeout)
  useInactivityLogout({
    timeoutMinutes: 5,
    warningMinutes: 4,
    onLogout: () => {
      log.info('User logged out due to inactivity', undefined, 'App');
    }
  });

  // Initialize background jobs
  useEffect(() => {
    BackgroundJobService.initialize();
    
    // Cleanup on unmount
    return () => {
      BackgroundJobService.stopAllJobs();
    };
  }, []);

  // Initialize with timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      log.warn('App initialization timeout - forcing initialization', undefined, 'App');
      setIsInitialized(true);
    }, 3000); // 3 second timeout

    // Also set immediately for fast initialization
    setIsInitialized(true);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state if not initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
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
            <Route path="/user" element={<UserDashboardSimple />} />
            <Route path="/user-original" element={<UserDashboard />} />
            <Route path="/user-enhanced" element={<UserDashboardEnhanced />} />
            <Route path="/user-backgrounds" element={<UserDashboardWithBackgrounds />} />
            <Route path="/test-backgrounds" element={<TestBackgrounds />} />
            <Route path="/simple-test" element={<SimpleTest />} />
            <Route path="/futuristic" element={<FuturisticDashboard />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/admin" element={<Navigate to="/admin-panel" replace />} />
            {isDev && <Route path="/admin-test" element={<AdminTestPanel />} />}
            {isDev && <Route path="/admin-debug" element={<AdminDebug />} />}
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
            <Route path="/exclusive-benefits" element={<ExclusiveBenefitsPage />} />
            <Route path="/dao-voting" element={<UserDAODashboard />} />
            <Route path="/dao-admin" element={<DAODashboard />} />
            <Route path="/dao-vote" element={<UserDAODashboard />} />
            <Route path="/dao-governance" element={<Navigate to="/dao-voting" replace />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/auth-popup-test" element={<AuthPopupTest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global chatbot for pre-login routes only */}
          <ContactChatbot />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
