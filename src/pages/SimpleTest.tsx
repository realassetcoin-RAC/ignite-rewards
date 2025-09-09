import React from 'react';

const SimpleTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Simple Test Page</h1>
        <p className="text-xl">If you can see this, the routing is working!</p>
        <div className="mt-8">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;


