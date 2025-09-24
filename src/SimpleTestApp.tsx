import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

// Simple test page component
const SimpleTestPage = () => {
  // console.log('SimpleTestPage is rendering');
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Simple Test Page</h1>
        <p className="text-muted-foreground mb-8">If you can see this, the basic app is working!</p>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold text-foreground mb-2">App Status</h2>
            <p className="text-green-600">✅ React is working</p>
            <p className="text-green-600">✅ Routing is working</p>
            <p className="text-green-600">✅ Theme is working</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <h2 className="text-xl font-semibold text-foreground mb-2">Next Steps</h2>
            <p className="text-muted-foreground">If this page works, the issue is likely in the authentication system or main components.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleTestApp = () => {
  // console.log('SimpleTestApp is rendering');
  
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SimpleTestPage />} />
            <Route path="/test" element={<SimpleTestPage />} />
            <Route path="*" element={<SimpleTestPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default SimpleTestApp;


