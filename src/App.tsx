import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Import admin test utilities for debugging
import '@/utils/testAdminAccess';
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

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/merchant" element={<MerchantDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
