import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TestBackgrounds = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <Card className="bg-white/10 backdrop-blur-xl border-white/20 max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            Background Test Page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              This is a simplified test page to verify the routing is working.
            </p>
            <p className="text-green-400">
              ✅ If you can see this, the page is loading correctly!
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => window.location.href = '/simple-test'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              Go to Simple Test
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBackgrounds;
