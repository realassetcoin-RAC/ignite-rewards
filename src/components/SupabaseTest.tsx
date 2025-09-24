import React, { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';

export const SupabaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        setStatus('Testing Supabase client...');
        
        // Test getSession
        const sessionResult = await supabase.auth.getSession();
        console.log('Session test result:', sessionResult);
        
        // Test getUser
        const userResult = await supabase.auth.getUser();
        console.log('User test result:', userResult);
        
        setStatus('✅ Supabase client is working!');
        setError(null);
      } catch (err) {
        console.error('Supabase test error:', err);
        setStatus('❌ Supabase client error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testSupabase();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2">Supabase Client Test</h3>
      <p className="text-sm text-muted-foreground mb-2">{status}</p>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};
