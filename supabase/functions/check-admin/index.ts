import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Admin check function started');

    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Extract and verify the user token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.log('User authentication failed:', userError?.message);
      return new Response(JSON.stringify({ 
        isAdmin: false, 
        error: "Authentication failed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = userData.user;
    console.log('User authenticated:', user.email);

    // Check if user has admin role using service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError) {
      console.log('Profile query error:', profileError);
      return new Response(JSON.stringify({ 
        isAdmin: false, 
        error: "Profile not found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const isAdmin = profile?.role === 'admin';
    console.log('Admin check result:', { isAdmin, role: profile?.role });

    return new Response(JSON.stringify({ 
      isAdmin,
      role: profile?.role,
      email: user.email 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return new Response(JSON.stringify({ 
      isAdmin: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});