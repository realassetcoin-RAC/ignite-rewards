'use client';

import { ProgressCircle } from '@/components/ui/progress-circle';
import LoadingSpinner from './LoadingSpinner';
import PageLoader from './PageLoader';

export default function LoadingExamples() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Loading Components Examples</h1>
      
      {/* Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Default Spinner</h3>
            <LoadingSpinner />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Custom Size</h3>
            <LoadingSpinner size={48} />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Custom Text</h3>
            <LoadingSpinner text="Processing..." />
          </div>
        </div>
      </section>

      {/* Different Colors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Different Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Blue</h3>
            <LoadingSpinner className="text-blue-500" />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Green</h3>
            <LoadingSpinner className="text-green-500" />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Red</h3>
            <LoadingSpinner className="text-red-500" />
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Purple</h3>
            <LoadingSpinner className="text-purple-500" />
          </div>
        </div>
      </section>

      {/* Inline Usage */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inline Usage</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ProgressCircle value={25} size={24} strokeWidth={2} className="text-blue-500 animate-spin" />
            <span className="text-sm">Saving your changes...</span>
          </div>
          
          <div className="flex items-center gap-3">
            <ProgressCircle value={25} size={20} strokeWidth={2} className="text-green-500 animate-spin" />
            <span className="text-sm">Uploading file...</span>
          </div>
          
          <div className="flex items-center gap-3">
            <ProgressCircle value={25} size={28} strokeWidth={3} className="text-purple-500 animate-spin" />
            <span className="text-sm">Connecting to server...</span>
          </div>
        </div>
      </section>

      {/* Button Loading States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button Loading States</h2>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2">
            <ProgressCircle value={25} size={16} strokeWidth={2} className="text-white animate-spin" />
            Loading...
          </button>
          
          <button className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center gap-2">
            <ProgressCircle value={25} size={16} strokeWidth={2} className="text-white animate-spin" />
            Saving...
          </button>
          
          <button className="px-4 py-2 bg-purple-500 text-white rounded-md flex items-center gap-2">
            <ProgressCircle value={25} size={16} strokeWidth={2} className="text-white animate-spin" />
            Processing...
          </button>
        </div>
      </section>

      {/* Page Loader Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Page Loader</h2>
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-4">
            The PageLoader component provides a full-screen loading overlay with backdrop blur.
          </p>
          <div className="relative h-32 bg-background rounded border">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg border">
                <ProgressCircle 
                  value={25} 
                  size={48} 
                  strokeWidth={4} 
                  className="text-blue-500 animate-spin" 
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Loading...</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait while we process your request</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
