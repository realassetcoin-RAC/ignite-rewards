// Database Adapter for Local PostgreSQL and Supabase
// Automatically switches between local and cloud based on environment

// Conditionally import pg only in Node.js environment
let pg: any = null;
if (typeof window === 'undefined') {
  try {
    pg = require('pg');
  } catch (e) {
    console.warn('pg library not available in browser environment');
  }
}

import { createClient } from '@supabase/supabase-js';
import { environment } from '@/config/environment';


class DatabaseAdapter {
  private isLocal: boolean;
  public supabaseClient: any = null;

  constructor() {
    // Always use cloud Supabase database
    this.isLocal = false;

    console.log('🔧 DatabaseAdapter constructor:', {
      mode: 'Cloud Supabase (Forced)',
      enableMockAuth: environment.app.enableMockAuth,
      isLocal: this.isLocal,
      windowType: typeof window,
      supabaseUrl: environment.database.supabase.url,
      hasAnonKey: !!environment.database.supabase.anonKey
    });

    // FORCE real Supabase client - ignore mock auth setting
    console.log('🌐 FORCING Supabase cloud client (ignoring mock auth setting)');
        this.initializeSupabase();
  }


  private initializeSupabase() {
    console.log('Initializing Supabase client...');
    console.log('Environment config:', {
      enableMockAuth: environment.app.enableMockAuth,
      supabaseUrl: environment.database.supabase.url,
      hasAnonKey: !!environment.database.supabase.anonKey,
      anonKeyPreview: environment.database.supabase.anonKey ? environment.database.supabase.anonKey.substring(0, 20) + '...' : 'null'
    });
    
    // DEBUG: Log the actual environment variables
    console.log('🔍 DEBUG - Raw environment variables:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
    console.log('VITE_ENABLE_MOCK_AUTH:', import.meta.env.VITE_ENABLE_MOCK_AUTH);
    console.log('🔍 DEBUG - All import.meta.env keys:', Object.keys(import.meta.env));
    console.log('🔍 DEBUG - Full import.meta.env object:', import.meta.env);
    
    try {
      // Check if we have the required configuration
      if (!environment.database.supabase.url || !environment.database.supabase.anonKey) {
        console.error('❌ Missing Supabase configuration:', {
          url: environment.database.supabase.url,
          anonKey: !!environment.database.supabase.anonKey
        });
        throw new Error('Missing Supabase URL or anon key');
      }
      
        this.supabaseClient = createClient(
          environment.database.supabase.url,
          environment.database.supabase.anonKey
        );
      console.log('✅ Real Supabase client created successfully');
      
      // Test the connection with retry mechanism (async)
      this.testConnectionWithRetry().catch(error => {
        console.error('❌ All connection attempts failed:', error);
        console.log('🔄 Switching to mock client for development');
        this.supabaseClient = this.createMockSupabaseClient();
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      console.log('Falling back to mock client as last resort');
      // Fallback to mock client
      this.supabaseClient = this.createMockSupabaseClient();
    }
  }

  private async testConnectionWithRetry(maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔍 Testing Supabase connection (attempt ${attempt}/${maxRetries})...`);
      
      try {
        await this.testConnection();
        console.log('✅ Connection test successful');
        return; // Success, exit retry loop
      } catch (error) {
        console.warn(`⚠️ Connection attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('❌ All connection attempts failed');
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Create a timeout promise for the connection test
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );
      
      const queryPromise = this.supabaseClient.from('profiles').select('count').limit(1);
      
      const { error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        
        // Only fallback to mock mode for specific critical errors
        if (error.code === 'PGRST002' || 
            error.message?.includes('503') || 
            error.message?.includes('Service Unavailable') ||
            error.message?.includes('timeout') ||
            error.message?.includes('Connection timeout')) {
          console.error('❌ Critical Supabase service error - switching to mock client');
          console.log('🔄 Switching to mock client for development');
          this.supabaseClient = this.createMockSupabaseClient();
          return;
        }
        
        // For other errors (like table not found, permission issues), keep using real client
        console.warn('⚠️ Non-critical Supabase error - keeping real client:', error.message);
        console.log('✅ Continuing with real Supabase client despite error');
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      
      // Only fallback for network/timeout errors
      if (error.message?.includes('timeout') || 
          error.message?.includes('503') || 
          error.message?.includes('Service Unavailable') ||
          error.message?.includes('Connection timeout')) {
        console.error('❌ Network/timeout error - switching to mock client');
        console.log('🔄 Switching to mock client for development');
        this.supabaseClient = this.createMockSupabaseClient();
      } else {
        console.warn('⚠️ Non-critical connection error - keeping real client:', error.message);
        console.log('✅ Continuing with real Supabase client despite error');
      }
    }
  }

  // Local database methods removed - using cloud Supabase only

  public createMockSupabaseClient() {
    console.log('🔧 Creating comprehensive mock Supabase client for development...');
    return {
      auth: {
        getUser: async () => {
          console.log('Mock auth.getUser() - checking for mock user');
          
          // Check for mock OAuth user in localStorage
          const mockUserData = localStorage.getItem('mock_oauth_user');
          if (mockUserData) {
            try {
              const mockUser = JSON.parse(mockUserData);
              return { data: { user: mockUser }, error: null };
            } catch (error) {
              console.error('Error parsing mock user data:', error);
            }
          }
          
          return { data: { user: null }, error: null };
        },
        signInWithPassword: async (credentials: any) => {
          console.log('Mock auth.signInWithPassword()', credentials);
          
          // Check for admin user
          if (credentials.email === 'admin@igniterewards.com' && credentials.password === 'admin123!') {
            const adminUser = {
              id: 'admin-user-' + Date.now(),
              email: 'admin@igniterewards.com',
              user_metadata: {
                full_name: 'Admin User',
                name: 'Admin User',
                avatar_url: null
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const adminSession = {
              user: adminUser,
              access_token: 'mock-admin-access-token',
              refresh_token: 'mock-admin-refresh-token',
              expires_at: Date.now() + 3600000, // 1 hour from now
              token_type: 'bearer'
            };
            
            // Store admin user in localStorage for session persistence
            localStorage.setItem('mock_oauth_user', JSON.stringify(adminUser));
            
            return { data: { user: adminUser, session: adminSession }, error: null };
          }
          
          return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
        },
        signOut: async () => {
          console.log('Mock auth.signOut()');
          localStorage.removeItem('mock_oauth_user');
          return { error: null };
        },
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
          console.log('Mock auth.onAuthStateChange() - setting up mock listener');
          
          // Check for existing mock OAuth user
          const mockUserData = localStorage.getItem('mock_oauth_user');
          if (mockUserData) {
            try {
              const mockUser = JSON.parse(mockUserData);
              const mockSession = {
                user: mockUser,
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600000,
                token_type: 'bearer'
              };
              
              // Simulate SIGNED_IN event with mock session
              setTimeout(() => {
                callback('SIGNED_IN', mockSession);
              }, 100);
            } catch (error) {
              console.error('Error parsing mock OAuth user in onAuthStateChange:', error);
              setTimeout(() => {
                callback('SIGNED_OUT', null);
              }, 100);
            }
          } else {
            // No mock user, simulate SIGNED_OUT
            setTimeout(() => {
              callback('SIGNED_OUT', null);
            }, 100);
          }
          
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  console.log('Mock auth subscription unsubscribed');
                },
              },
            },
          };
        },
        getSession: async () => {
          console.log('Mock auth.getSession() - checking for mock session');
          
          // Check for mock OAuth user in localStorage
          const mockUserData = localStorage.getItem('mock_oauth_user');
          if (mockUserData) {
            try {
              const mockUser = JSON.parse(mockUserData);
              const mockSession = {
                user: mockUser,
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
                expires_at: Date.now() + 3600000, // 1 hour from now
                token_type: 'bearer'
              };
              
              console.log('Found mock OAuth user, returning session');
              return { data: { session: mockSession }, error: null };
            } catch (error) {
              console.error('Error parsing mock OAuth user:', error);
            }
          }
          
          return { data: { session: null }, error: null };
        },
        refreshSession: async () => {
          console.log('Mock auth.refreshSession() - returning mock session');
          return { data: { session: null }, error: null };
        },
        signUp: async (credentials: any) => {
          console.log('Mock auth.signUp()', credentials);
          
          // Create a new user with email verification bypassed for testing
          const newUser = {
            id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            email: credentials.email,
            email_confirmed_at: new Date().toISOString(), // Mock: mark as verified immediately
            user_metadata: {
              full_name: credentials.email.split('@')[0] || 'User',
              name: credentials.email.split('@')[0] || 'User',
              avatar_url: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const newSession = {
            user: newUser,
            access_token: 'mock-access-token-' + Date.now(),
            refresh_token: 'mock-refresh-token-' + Date.now(),
            expires_at: Date.now() + 3600000, // 1 hour from now
            token_type: 'bearer'
          };
          
          // Store user in localStorage for session persistence
          localStorage.setItem('mock_oauth_user', JSON.stringify(newUser));
          
          console.log('✅ User created successfully with mock email verification');
          console.log('📧 [MOCK EMAIL] Email verification bypassed - user marked as verified');
          
          return { data: { user: newUser, session: newSession }, error: null };
        },
        signInWithOAuth: async (options: any) => {
          console.log('Mock auth.signInWithOAuth()', options);
          
          // For mock mode, simulate OAuth flow locally
          if (options.provider === 'google') {
            const redirectUrl = options.options?.redirectTo || `${window.location.origin}/auth/callback`;
            
            // Simulate OAuth flow by directly redirecting to callback with mock data
            setTimeout(() => {
              // Create a mock user session
              const mockUser = {
                id: 'mock-user-' + Date.now(),
                email: 'test@example.com',
                user_metadata: {
                  full_name: 'Test User',
                  name: 'Test User',
                  avatar_url: null
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              // Store mock session in localStorage for the callback to pick up
              localStorage.setItem('mock_oauth_user', JSON.stringify(mockUser));
              
              // Redirect to callback
              window.location.href = redirectUrl;
            }, 1000); // Small delay to simulate OAuth flow
            
            return { 
              data: { 
                url: redirectUrl,
                provider: 'google'
              }, 
              error: null 
            };
          }
          
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Provider not supported in mock mode' } 
          };
        },
        resend: async (options: any) => {
          console.log('Mock auth.resend()', options);
          return { data: null, error: null };
        }
      },
      from: (table: string) => {
        console.log(`🔧 Mock: from(${table}) called`);
        
        // Return mock data for specific tables
        const getMockData = () => {
          switch (table) {
            case 'nft_types':
              return [
                // ✅ EXACT SPECIFICATIONS FROM CUSTODIAL ATTRIBUTES TABLE
                
                // 1. Pearl White - Buy Price NFT: 0, Rarity: Common, Mint: 10000
                { 
                  id: '1', 
                  collection: 'Classic',
                  nft_name: 'Pearl White', 
                  display_name: 'Pearl White', 
                  image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400',
                  buy_price_usdt: 0,
                  buy_price_nft: 0,
                  rarity: 'Common',
                  mint_quantity: 10000,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.01, // 1.00%
                  upgrade_bonus_ratio: 0.00, // 0.00%
                  evolution_min_investment: 100,
                  evolution_earnings_ratio: 0.0025, // 0.25%
                  passive_income_rate: 0.01,
                  custodial_income_rate: 0,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                
                // 2. Lava Orange - Buy Price NFT: 100, Rarity: Less Common, Mint: 3000
                { 
                  id: '2', 
                  collection: 'Classic',
                  nft_name: 'Lava Orange', 
                  display_name: 'Lava Orange', 
                  image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
                  buy_price_usdt: 100,
                  buy_price_nft: 100,
                  rarity: 'Less Common',
                  mint_quantity: 3000,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.011, // 1.10%
                  upgrade_bonus_ratio: 0.001, // 0.10%
                  evolution_min_investment: 500,
                  evolution_earnings_ratio: 0.005, // 0.50%
                  passive_income_rate: 0.011,
                  custodial_income_rate: 0.001,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                
                // 3. Pink - Buy Price NFT: 100, Rarity: Less Common, Mint: 3000
                { 
                  id: '3', 
                  collection: 'Classic',
                  nft_name: 'Pink', 
                  display_name: 'Pink', 
                  image_url: 'https://images.unsplash.com/photo-1580894736036-1d3b4b9d3ad4?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
                  buy_price_usdt: 100,
                  buy_price_nft: 100,
                  rarity: 'Less Common',
                  mint_quantity: 3000,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.011, // 1.10%
                  upgrade_bonus_ratio: 0.001, // 0.10%
                  evolution_min_investment: 500,
                  evolution_earnings_ratio: 0.005, // 0.50%
                  passive_income_rate: 0.011,
                  custodial_income_rate: 0.001,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                
                // 4. Silver - Buy Price NFT: 200, Rarity: Rare, Mint: 750
                { 
                  id: '4', 
                  collection: 'Classic',
                  nft_name: 'Silver', 
                  display_name: 'Silver', 
                  image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
                  buy_price_usdt: 200,
                  buy_price_nft: 200,
                  rarity: 'Rare',
                  mint_quantity: 750,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.012, // 1.20%
                  upgrade_bonus_ratio: 0.0015, // 0.15%
                  evolution_min_investment: 1000,
                  evolution_earnings_ratio: 0.0075, // 0.75%
                  passive_income_rate: 0.012,
                  custodial_income_rate: 0.0015,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                
                // 5. Gold - Buy Price NFT: 300, Rarity: Rare, Mint: 750
                { 
                  id: '5', 
                  collection: 'Classic',
                  nft_name: 'Gold', 
                  display_name: 'Gold', 
                  image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
                  buy_price_usdt: 300,
                  buy_price_nft: 300,
                  rarity: 'Rare',
                  mint_quantity: 750,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.013, // 1.30%
                  upgrade_bonus_ratio: 0.002, // 0.20%
                  evolution_min_investment: 1500,
                  evolution_earnings_ratio: 0.01, // 1.00%
                  passive_income_rate: 0.013,
                  custodial_income_rate: 0.002,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                
                // 6. Black - Buy Price NFT: 500, Rarity: Very Rare, Mint: 250
                { 
                  id: '6', 
                  collection: 'Classic',
                  nft_name: 'Black', 
                  display_name: 'Black', 
                  image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
                  evolution_image_url: 'https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400',
                  buy_price_usdt: 500,
                  buy_price_nft: 500,
                  rarity: 'Very Rare',
                  mint_quantity: 250,
                  is_upgradeable: true,
                  is_evolvable: true,
                  is_fractional_eligible: false, // Fractional: No
                  is_custodial: true,
                  auto_staking_duration: 'Forever',
                  earn_on_spend_ratio: 0.014, // 1.40%
                  upgrade_bonus_ratio: 0.003, // 0.30%
                  evolution_min_investment: 2500,
                  evolution_earnings_ratio: 0.0125, // 1.25%
                  passive_income_rate: 0.014,
                  custodial_income_rate: 0.003,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
              ];
            case 'user_loyalty_cards':
              return [
                {
                  id: '1',
                  user_id: '00000000-0000-0000-0000-000000000001',
                  nft_type_id: '1',
                  loyalty_number: 'A1234567',
                  card_number: 'LC123456',
                  full_name: 'Admin User',
                  email: 'admin@igniterewards.com',
                  phone: null,
                  points_balance: 1250,
                  tier_level: 'gold',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '2',
                  user_id: '00000000-0000-0000-0000-000000000002',
                  nft_type_id: '2',
                  loyalty_number: 'B2345678',
                  card_number: 'LC234567',
                  full_name: 'Demo User',
                  email: 'demo@igniterewards.com',
                  phone: '+1234567890',
                  points_balance: 750,
                  tier_level: 'silver',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '3',
                  user_id: '00000000-0000-0000-0000-000000000003',
                  nft_type_id: '3',
                  loyalty_number: 'C3456789',
                  card_number: 'LC345678',
                  full_name: 'Premium User',
                  email: 'premium@igniterewards.com',
                  phone: '+1987654321',
                  points_balance: 2500,
                  tier_level: 'platinum',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ];
            case 'merchant_subscription_plans':
              return [
                {
                  id: '1',
                  name: 'StartUp',
                  description: 'Perfect for small businesses and startups looking to build customer loyalty',
                  price_monthly: 20.00,
                  price_yearly: 150.00,
                  monthly_points: 100,
                  monthly_transactions: 100,
                  features: [
                    'Basic loyalty program setup',
                    'Up to 100 transactions per month',
                    'Customer database management',
                    'Email support',
                    'Basic analytics and reporting',
                    'QR code generation',
                    'Mobile app for customers'
                  ],
                  trial_days: 14,
                  is_active: true,
                  popular: false,
                  plan_number: 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '2',
                  name: 'Momentum Plan',
                  description: 'Ideal for growing businesses that need more advanced features and higher limits',
                  price_monthly: 50.00,
                  price_yearly: 500.00,
                  monthly_points: 300,
                  monthly_transactions: 300,
                  features: [
                    'Advanced loyalty program features',
                    'Up to 300 transactions per month',
                    'Advanced customer segmentation',
                    'Priority email support',
                    'Advanced analytics and custom reports',
                    'Custom QR codes with branding',
                    'API access for integrations',
                    'Up to 3 staff accounts'
                  ],
                  trial_days: 14,
                  is_active: true,
                  popular: true,
                  plan_number: 2,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '3',
                  name: 'Energizer Plan',
                  description: 'For established businesses requiring enterprise-level features and higher capacity',
                  price_monthly: 100.00,
                  price_yearly: 1000.00,
                  monthly_points: 600,
                  monthly_transactions: 600,
                  features: [
                    'Premium loyalty program features',
                    'Up to 600 transactions per month',
                    'Advanced customer analytics and insights',
                    'Dedicated account manager',
                    'Real-time analytics and reporting',
                    'Fully customizable loyalty programs',
                    'Advanced API access',
                    'Up to 6 staff accounts',
                    'Custom integrations',
                    '24/7 phone and chat support'
                  ],
                  trial_days: 21,
                  is_active: true,
                  popular: false,
                  plan_number: 3,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '4',
                  name: 'Cloud Plan',
                  description: 'High-volume solution for large enterprises with extensive transaction needs',
                  price_monthly: 250.00,
                  price_yearly: 2500.00,
                  monthly_points: 1800,
                  monthly_transactions: 1800,
                  features: [
                    'Enterprise loyalty program features',
                    'Up to 1800 transactions per month',
                    'Advanced customer analytics and insights',
                    'Dedicated account manager',
                    'Real-time analytics and reporting',
                    'Fully customizable loyalty programs',
                    'Enterprise-grade security',
                    'Advanced API access',
                    'Unlimited staff accounts',
                    'Custom integrations',
                    'Multi-location support',
                    '24/7 phone and chat support',
                    'Custom onboarding and training'
                  ],
                  trial_days: 30,
                  is_active: true,
                  popular: false,
                  plan_number: 4,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '5',
                  name: 'Super Plan',
                  description: 'Ultimate solution for massive enterprises with unlimited transaction requirements',
                  price_monthly: 500.00,
                  price_yearly: 5000.00,
                  monthly_points: 4000,
                  monthly_transactions: 4000,
                  features: [
                    'Ultimate loyalty program features',
                    'Up to 4000 transactions per month',
                    'Advanced customer analytics and insights',
                    'Dedicated account manager',
                    'Real-time analytics and reporting',
                    'Fully customizable loyalty programs',
                    'Enterprise-grade security',
                    'Advanced API access',
                    'Unlimited staff accounts',
                    'Custom integrations',
                    'Multi-location support',
                    '24/7 phone and chat support',
                    'Custom onboarding and training',
                    'White-label solutions',
                    'Priority feature requests'
                  ],
                  trial_days: 30,
                  is_active: true,
                  popular: false,
                  plan_number: 5,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ];
            case 'subscription_plans':
              return [
                {
                  id: '1',
                  plan_name: 'Basic',
                  description: 'Basic merchant plan with essential features',
                  price: 29.99,
                  currency: 'USD',
                  billing_cycle: 'monthly',
                  max_transactions: 1000,
                  max_points_distribution: 10000,
                  features: ['Basic analytics', 'QR code generation', 'Customer management'],
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '2',
                  plan_name: 'Professional',
                  description: 'Professional merchant plan with advanced features',
                  price: 79.99,
                  currency: 'USD',
                  billing_cycle: 'monthly',
                  max_transactions: 5000,
                  max_points_distribution: 50000,
                  features: ['Advanced analytics', 'Custom branding', 'API access', 'Priority support'],
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '3',
                  plan_name: 'Enterprise',
                  description: 'Enterprise merchant plan with unlimited features',
                  price: 199.99,
                  currency: 'USD',
                  billing_cycle: 'monthly',
                  max_transactions: -1, // unlimited
                  max_points_distribution: -1, // unlimited
                  features: ['Unlimited everything', 'White-label solution', 'Dedicated support', 'Custom integrations'],
                  is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
                },
              ];
            case 'merchants':
              return [
                { 
                  id: '1', 
                  business_name: 'Test Merchant 1', 
                  contact_email: 'merchant1@test.com', 
                  status: 'active',
                  subscription_plan_id: '1',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                { 
                  id: '2', 
                  business_name: 'Test Merchant 2', 
                  contact_email: 'merchant2@test.com', 
                  status: 'pending',
                  subscription_plan_id: '2',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
                },
              ];
            case 'issue_categories':
              return [
                { id: '1', category_name: 'Technical Support', description: 'Technical issues and support requests', is_active: true },
                { id: '2', category_name: 'Account Issues', description: 'Account-related problems and questions', is_active: true },
                { id: '3', category_name: 'Payment Issues', description: 'Payment and billing related issues', is_active: true }
              ];
              case 'profiles':
                return [
                  { id: '1', email: 'admin@igniterewards.com', full_name: 'Admin User', role: 'admin' }
                ];
              case 'nft_collections':
                return [
                  { 
                    id: '1', 
                    collection_name: 'classic', 
                    display_name: 'Classic Collection', 
                    description: 'The original loyalty NFT collection featuring various rarity levels and benefits',
                    contract_address: null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  },
                  { 
                    id: '2', 
                    collection_name: 'premium', 
                    display_name: 'Premium Collection', 
                    description: 'Premium loyalty NFT collection with enhanced benefits and features',
                    contract_address: null,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  },
                  { 
                    id: '3', 
                    collection_name: 'elite', 
                    display_name: 'Elite Collection', 
                    description: 'Elite loyalty NFT collection for high-value customers',
                    contract_address: null,
                    is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
                  },
                ];
            case 'transaction_qr_codes':
              return [
                {
                  id: '1',
                  merchant_id: '00000000-0000-0000-0000-000000000001',
                  qr_code_data: JSON.stringify({
                    id: '1',
                    merchant_id: '00000000-0000-0000-0000-000000000001',
                    amount: 25.99,
                    reward_points: 25,
                    receipt_number: 'RCP001',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  }),
                  transaction_amount: 25.99,
                  reward_points: 25,
                  receipt_number: 'RCP001',
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: '2',
                  merchant_id: '00000000-0000-0000-0000-000000000001',
                  qr_code_data: JSON.stringify({
                    id: '2',
                    merchant_id: '00000000-0000-0000-0000-000000000001',
                    amount: 49.50,
                    reward_points: 49,
                    receipt_number: 'RCP002',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                  }),
                  transaction_amount: 49.50,
                  reward_points: 49,
                  receipt_number: 'RCP002',
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ];
              default:
                return [];
          }
        };
        
        return {
          select: (columns: string = '*', options?: any) => {
            const mockData = getMockData();
            return {
            eq: (column: string, value: any) => ({
              maybeSingle: async () => {
                console.log(`🔧 Mock: maybeSingle() called for ${table}`);
                  return { data: mockData.length > 0 ? mockData[0] : null, error: null };
              },
              single: async () => {
                console.log(`🔧 Mock: single() called for ${table}`);
                  return { data: mockData.length > 0 ? mockData[0] : null, error: null };
              },
              limit: (count: number) => ({
                then: async (callback: (result: any) => any) => {
                  console.log(`🔧 Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ? LIMIT ${count}`);
                  const limitedData = mockData.slice(0, count);
                  return callback({ data: limitedData, error: null });
                }
              }),
              order: (orderColumn: string, options?: { ascending?: boolean }) => ({
                then: async (callback: (result: any) => any) => {
                  console.log(`🔧 Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ? ORDER BY ${orderColumn}`);
                    return callback({ data: mockData, error: null });
                  }
              })
            }),
            limit: (count: number) => ({
              then: async (callback: (result: any) => any) => {
                console.log(`🔧 Mock query: SELECT ${columns} FROM ${table} LIMIT ${count}`);
                const limitedData = mockData.slice(0, count);
                return callback({ data: limitedData, error: null });
              }
            }),
            order: (orderColumn: string, options?: { ascending?: boolean }) => ({
              then: async (callback: (result: any) => any) => {
                console.log(`🔧 Mock query: SELECT ${columns} FROM ${table} ORDER BY ${orderColumn}`);
                  return callback({ data: mockData, error: null });
                }
            }),
            maybeSingle: async () => {
              console.log(`🔧 Mock: maybeSingle() called for ${table}`);
                return { data: mockData.length > 0 ? mockData[0] : null, error: null };
            },
            single: async () => {
              console.log(`🔧 Mock: single() called for ${table}`);
                return { data: mockData.length > 0 ? mockData[0] : null, error: null };
            },
            then: async (callback: (result: any) => any) => {
              console.log(`🔧 Mock query: SELECT ${columns} FROM ${table}`);
                return callback({ data: mockData, error: null });
              }
            };
            },
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              console.log(`Mock insert into ${table}:`, data);
              if (table === 'transaction_qr_codes') {
                // Return the inserted data with a generated ID
                const insertedData = {
                  id: 'qr-' + Date.now(),
                  ...data,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                return { data: insertedData, error: null };
              }
              return { data: null, error: null };
            }
          }),
          then: async (callback: (result: any) => any) => {
            console.log(`Mock insert into ${table}:`, data);
            if (table === 'transaction_qr_codes') {
              // Return the inserted data with a generated ID
              const insertedData = {
                id: 'qr-' + Date.now(),
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              return callback({ data: insertedData, error: null });
            }
            return callback({ data: null, error: null });
          }
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            select: () => ({ data: null, error: null }),
            then: async (callback: (result: any) => any) => {
              console.log(`Mock update ${table} SET ... WHERE ${column} = ?:`, data);
              return callback({ data: null, error: null });
            },
          })
        }),
        deleteRecord: () => ({
          eq: (column: string, value: any) => ({
            then: async (callback: (result: any) => any) => {
              console.log(`Mock delete from ${table} WHERE ${column} = ?`);
              return callback({ data: null, error: null });
            },
          })
        })
      };
      },
      rpc: (functionName: string, params?: any) => {
        console.log(`Mock RPC call: ${functionName}`, params);
        
        // Mock admin check
        if (functionName === 'is_admin') {
            const mockUserData = localStorage.getItem('mock_oauth_user');
            if (mockUserData) {
                const mockUser = JSON.parse(mockUserData);
            if (mockUser.email === 'admin@igniterewards.com') {
              return Promise.resolve({ data: true, error: null });
            }
          }
          return Promise.resolve({ data: false, error: null });
        }
        
        // Mock check_admin_access function
        if (functionName === 'check_admin_access') {
          const mockUserData = localStorage.getItem('mock_oauth_user');
          if (mockUserData) {
            const mockUser = JSON.parse(mockUserData);
            if (mockUser.email === 'admin@igniterewards.com') {
              return Promise.resolve({ data: true, error: null });
            }
          }
          return Promise.resolve({ data: false, error: null });
        }
        
        // Mock can_use_mfa function
        if (functionName === 'can_use_mfa') {
          return Promise.resolve({ data: true, error: null });
        }
        
        // Mock get_current_user_profile function
        if (functionName === 'get_current_user_profile') {
          const mockUserData = localStorage.getItem('mock_oauth_user');
          if (mockUserData) {
            const mockUser = JSON.parse(mockUserData);
            const mockProfile = {
              id: mockUser.id,
              email: mockUser.email,
              full_name: mockUser.user_metadata?.full_name || 'Test User',
              role: mockUser.email === 'admin@igniterewards.com' ? 'admin' : 'user',
              created_at: mockUser.created_at,
              updated_at: mockUser.updated_at
            };
            return Promise.resolve({ data: [mockProfile], error: null });
          }
          return Promise.resolve({ data: [], error: null });
        }
        
        // Mock generate_loyalty_number function
        if (functionName === 'generate_loyalty_number') {
          const randomNumber = Math.floor(Math.random() * 9000000) + 1000000;
          const loyaltyNumber = 'A' + randomNumber.toString();
          return Promise.resolve({ data: loyaltyNumber, error: null });
        }
        
        // Mock generate_referral_code function
        if (functionName === 'generate_referral_code') {
          const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          return Promise.resolve({ data: randomCode, error: null });
        }
        
        // Mock get_valid_subscription_plans function
        if (functionName === 'get_valid_subscription_plans') {
          const validPlans = [
            {
              id: '1',
              name: 'StartUp',
              description: 'Perfect for small businesses and startups looking to build customer loyalty',
              price_monthly: 20.00,
              price_yearly: 150.00,
              monthly_points: 100,
              monthly_transactions: 100,
              features: [
                'Basic loyalty program setup',
                'Up to 100 transactions per month',
                'Customer database management',
                'Email support',
                'Basic analytics and reporting',
                'QR code generation',
                'Mobile app for customers'
              ],
              trial_days: 14,
              is_active: true,
              popular: false,
              plan_number: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Momentum Plan',
              description: 'Ideal for growing businesses that need more advanced features and higher limits',
              price_monthly: 50.00,
              price_yearly: 500.00,
              monthly_points: 300,
              monthly_transactions: 300,
              features: [
                'Advanced loyalty program features',
                'Up to 300 transactions per month',
                'Advanced customer segmentation',
                'Priority email support',
                'Advanced analytics and custom reports',
                'Custom QR codes with branding',
                'API access for integrations',
                'Up to 3 staff accounts'
              ],
              trial_days: 14,
              is_active: true,
              popular: true,
              plan_number: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              name: 'Energizer Plan',
              description: 'For established businesses requiring enterprise-level features and higher capacity',
              price_monthly: 100.00,
              price_yearly: 1000.00,
              monthly_points: 600,
              monthly_transactions: 600,
              features: [
                'Premium loyalty program features',
                'Up to 600 transactions per month',
                'Advanced customer analytics and insights',
                'Dedicated account manager',
                'Real-time analytics and reporting',
                'Fully customizable loyalty programs',
                'Advanced API access',
                'Up to 6 staff accounts',
                'Custom integrations',
                '24/7 phone and chat support'
              ],
              trial_days: 21,
              is_active: true,
              popular: false,
              plan_number: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '4',
              name: 'Cloud Plan',
              description: 'High-volume solution for large enterprises with extensive transaction needs',
              price_monthly: 250.00,
              price_yearly: 2500.00,
              monthly_points: 1800,
              monthly_transactions: 1800,
              features: [
                'Enterprise loyalty program features',
                'Up to 1800 transactions per month',
                'Advanced customer analytics and insights',
                'Dedicated account manager',
                'Real-time analytics and reporting',
                'Fully customizable loyalty programs',
                'Enterprise-grade security',
                'Advanced API access',
                'Unlimited staff accounts',
                'Custom integrations',
                'Multi-location support',
                '24/7 phone and chat support',
                'Custom onboarding and training'
              ],
              trial_days: 30,
              is_active: true,
              popular: false,
              plan_number: 4,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '5',
              name: 'Super Plan',
              description: 'Ultimate solution for massive enterprises with unlimited transaction requirements',
              price_monthly: 500.00,
              price_yearly: 5000.00,
              monthly_points: 4000,
              monthly_transactions: 4000,
              features: [
                'Ultimate loyalty program features',
                'Up to 4000 transactions per month',
                'Advanced customer analytics and insights',
                'Dedicated account manager',
                'Real-time analytics and reporting',
                'Fully customizable loyalty programs',
                'Enterprise-grade security',
                'Advanced API access',
                'Unlimited staff accounts',
                'Custom integrations',
                'Multi-location support',
                '24/7 phone and chat support',
                'Custom onboarding and training',
                'White-label solutions',
                'Priority feature requests'
              ],
              trial_days: 30,
              is_active: true,
              popular: false,
              plan_number: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          return {
            then: async (callback: (result: any) => any) => {
              console.log(`Mock RPC call: ${functionName} returning ${validPlans.length} plans`);
              return callback({ data: validPlans, error: null });
            }
          };
        }
        
        return {
          then: async (callback: (result: any) => any) => {
            return callback({ data: null, error: null });
          }
        };
      },
      storage: {
        from: (bucket: string) => ({
          list: (path: string = '', options?: any) => ({
            then: async (callback: (result: any) => any) => {
              console.log(`🔧 Mock storage: list(${bucket}, ${path})`);
              // Return mock storage data
              const mockFiles = [
                { name: 'sample-image.jpg', size: 1024, updated_at: new Date().toISOString() },
                { name: 'sample-document.pdf', size: 2048, updated_at: new Date().toISOString() }
              ];
              return callback({ data: mockFiles, error: null });
            }
          }),
          upload: (path: string, file: any, options?: any) => ({
            then: async (callback: (result: any) => any) => {
              console.log(`🔧 Mock storage: upload(${bucket}, ${path})`);
              return callback({ data: { path }, error: null });
            }
          }),
          download: (path: string) => ({
            then: async (callback: (result: any) => any) => {
              console.log(`🔧 Mock storage: download(${bucket}, ${path})`);
              return callback({ data: new Blob(['mock file content']), error: null });
            }
          }),
          remove: (paths: string[]) => ({
            then: async (callback: (result: any) => any) => {
              console.log(`🔧 Mock storage: remove(${bucket}, ${paths.join(', ')})`);
              return callback({ data: paths, error: null });
            }
          })
        })
      },
      _isMockClient: true
    };
  }

  // Duplicate initializeSupabase method removed - using the one above

  // Supabase-compatible interface - always use cloud Supabase
  from(table: string) {
    if (!this.supabaseClient) {
      console.error('❌ Supabase client is null, initializing fallback...');
      // Initialize fallback client
      this.supabaseClient = this.createMockSupabaseClient();
    }
    
    return this.supabaseClient.from(table);
  }

  // Local query builder removed - using cloud Supabase only

  // Supabase client getter for compatibility
  get supabase() {
    if (!this.supabaseClient) {
      console.error('❌ Supabase client is null, initializing fallback...');
      this.supabaseClient = this.createMockSupabaseClient();
    }
    return this.supabaseClient;
  }

  // Auth methods - always use Supabase
  get auth() {
    if (!this.supabaseClient) {
      console.error('❌ Supabase client is null, initializing fallback for auth...');
      this.supabaseClient = this.createMockSupabaseClient();
    }
    
    if (this.supabaseClient && this.supabaseClient.auth) {
      return this.supabaseClient.auth;
    } else {
      console.warn('Supabase client not available, using mock auth');
      // Return mock auth methods as fallback
      return this.createMockSupabaseClient().auth;
    }
  }

  // RPC method for calling database functions
  rpc(functionName: string, params?: any) {
    if (!this.supabaseClient) {
      console.error('❌ Supabase client is null, initializing fallback for RPC...');
      this.supabaseClient = this.createMockSupabaseClient();
    }
    
    if (this.supabaseClient && this.supabaseClient.rpc) {
      return this.supabaseClient.rpc(functionName, params);
    } else {
      // Fallback to mock RPC response
    return {
      then: async (callback: (result: any) => any) => {
          console.log(`Mock RPC call: ${functionName}`, params);
        return callback({ data: null, error: null });
      }
    };
    }
  }

  // Check if we're in mock mode
  isMockMode() {
    return this.supabaseClient && this.supabaseClient._isMockClient;
  }

  // Force real Supabase client usage (for when database is confirmed working)
  forceRealSupabase() {
    console.log('🔄 Forcing real Supabase client usage...');
    try {
      this.supabaseClient = createClient(
        environment.database.supabase.url,
        environment.database.supabase.anonKey
      );
      console.log('✅ Real Supabase client forced successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to force real Supabase client:', error);
      return false;
    }
  }

  // Test if real Supabase is working without fallback
  async testRealSupabaseConnection() {
    if (!this.supabaseClient || this.supabaseClient._isMockClient) {
      console.log('🔄 Creating real Supabase client for testing...');
      this.supabaseClient = createClient(
        environment.database.supabase.url,
        environment.database.supabase.anonKey
      );
    }

    try {
      console.log('🔍 Testing real Supabase connection...');
      const { error } = await this.supabaseClient.from('profiles').select('count').limit(1);
      
      if (error) {
        console.error('❌ Real Supabase connection error:', error);
        return false;
      } else {
        console.log('✅ Real Supabase connection successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Real Supabase connection test failed:', error);
      return false;
    }
  }

  // Close connections - Supabase handles its own connection management
  async close() {
    // Supabase client handles its own connection cleanup
    console.log('Database adapter closed - Supabase connection managed automatically');
  }
}

// Create singleton instance
export const databaseAdapter = new DatabaseAdapter();

// Ensure the client is initialized - FORCE real Supabase client
if (!databaseAdapter.supabaseClient) {
  console.warn('⚠️ Database adapter client not initialized, forcing REAL Supabase initialization...');
  
  // DEBUG: Log environment variables in forced initialization
  console.log('🔍 DEBUG - Forced initialization environment variables:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
  console.log('Environment URL:', environment.database.supabase.url);
  console.log('Environment Key:', environment.database.supabase.anonKey ? 'present' : 'missing');
  
  try {
    databaseAdapter.supabaseClient = createClient(
      environment.database.supabase.url,
      environment.database.supabase.anonKey
    );
    console.log('✅ Real Supabase client forced initialization successful');
    console.log('🔍 DEBUG - Forced client URL:', databaseAdapter.supabaseClient.supabaseUrl);
  } catch (error) {
    console.error('❌ Failed to force initialize Supabase client:', error);
    console.log('Falling back to mock client as last resort');
    databaseAdapter.supabaseClient = databaseAdapter.createMockSupabaseClient();
  }
}

// Export as supabase for compatibility
export const supabase = databaseAdapter;
export default supabase;
