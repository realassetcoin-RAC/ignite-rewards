// Local Authentication Client for Docker PostgreSQL
// This client provides authentication functionality using the local auth schema

// Removed databaseAdapter import to avoid circular dependency

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  aud: string;
  created_at: string;
  updated_at: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
}

interface AuthResponse {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
  error: any;
}

class LocalAuthClient {
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;

  constructor() {
    console.log('🔐 Local Auth Client initialized');
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage() {
    try {
      const storedSession = localStorage.getItem('local-auth-session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.expires_at > Date.now() / 1000) {
          this.currentSession = session;
          this.currentUser = session.user;
          console.log('✅ Session loaded from storage');
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
      this.clearSession();
    }
  }

  private saveSessionToStorage(session: AuthSession) {
    try {
      localStorage.setItem('local-auth-session', JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session to storage:', error);
    }
  }

  private clearSession() {
    this.currentUser = null;
    this.currentSession = null;
    localStorage.removeItem('local-auth-session');
  }

  private generateTokens(user: AuthUser): AuthSession {
    const now = Math.floor(Date.now() / 1000);
    return {
      access_token: `local-token-${user.id}-${now}`,
      refresh_token: `local-refresh-${user.id}-${now}`,
      expires_in: 3600, // 1 hour
      expires_at: now + 3600,
      token_type: 'bearer',
      user
    };
  }

  async signInWithPassword({ email, password }: { email: string; password: string }): Promise<AuthResponse> {
    try {
      console.log('🔐 Local authentication attempt:', { email, password: '***' });

      // Fast path: allow known local admin credentials without DB reads (local dev convenience)
      if (email === 'admin@rac-rewards.com' && password === 'admin123!') {
        const adminUser: AuthUser = {
          id: crypto.randomUUID(),
          email,
          role: 'admin',
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const adminSession = this.generateTokens(adminUser);
        this.currentUser = adminUser;
        this.currentSession = adminSession;
        this.saveSessionToStorage(adminSession);
        console.log('✅ Local admin authentication shortcut used');
        return { data: { user: adminUser, session: adminSession }, error: null };
      }

      // For local development, only allow the admin user
      console.log('❌ User not found or invalid credentials');
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      };

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'Authentication failed' }
      };
    }
  }

  async signUp({ email, password, options }: { 
    email: string; 
    password: string; 
    options?: { data?: any } 
  }): Promise<AuthResponse> {
    try {
      console.log('🔐 Local signup attempt:', { email, password: '***' });

      // For local development, simulate signup by creating a local user/session
      const newUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        role: 'merchant',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Optionally store minimal profile data from options
      if (options?.data) {
        console.log('ℹ️ Attached signup profile data (local only)', options.data);
      }

      const session = this.generateTokens(newUser);
      this.currentUser = newUser;
      this.currentSession = session;
      this.saveSessionToStorage(session);

      console.log('✅ Local signup simulated successfully');
      return { data: { user: newUser, session }, error: null };

    } catch (error) {
      console.error('❌ Signup error:', error);
      return {
        data: { user: null, session: null },
        error: { message: 'Signup failed' }
      };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      this.clearSession();
      console.log('✅ Signout successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Signout error:', error);
      return { error: { message: 'Signout failed' } };
    }
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }, error: any }> {
    try {
      if (this.currentSession && this.currentSession.expires_at > Date.now() / 1000) {
        return { data: { user: this.currentUser }, error: null };
      } else {
        this.clearSession();
        return { data: { user: null }, error: null };
      }
    } catch (error) {
      console.error('❌ Get user error:', error);
      return { data: { user: null }, error: { message: 'Failed to get user' } };
    }
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }, error: any }> {
    try {
      if (this.currentSession && this.currentSession.expires_at > Date.now() / 1000) {
        return { data: { session: this.currentSession }, error: null };
      } else {
        this.clearSession();
        return { data: { session: null }, error: null };
      }
    } catch (error) {
      console.error('❌ Get session error:', error);
      return { data: { session: null }, error: { message: 'Failed to get session' } };
    }
  }

  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
    // Simple implementation - in a real app you'd use proper event handling
    const checkAuthState = () => {
      if (this.currentSession && this.currentSession.expires_at > Date.now() / 1000) {
        callback('SIGNED_IN', this.currentSession);
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    // Check immediately
    checkAuthState();

    // Check periodically
    const interval = setInterval(checkAuthState, 30000); // Check every 30 seconds

    // Return Supabase-compatible structure with data.subscription
    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval)
        }
      }
    };
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash function for demo - in production use bcrypt
    const encoder = new TextEncoder();
    const bytes = encoder.encode(password + 'salt');
    // Some TS environments are picky about BufferSource; pass ArrayBuffer explicitly
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Google OAuth simulation (for demo purposes)
  async signInWithOAuth({ provider }: { provider: string }): Promise<AuthResponse> {
    console.log(`🔐 OAuth signin with ${provider} (simulated)`);
    
    // For demo, create a Google user
    const googleUser: AuthUser = {
      id: crypto.randomUUID(),
      email: 'google.user@example.com',
      role: 'customer',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const session = this.generateTokens(googleUser);
    
    this.currentUser = googleUser;
    this.currentSession = session;
    this.saveSessionToStorage(session);

    return { data: { user: googleUser, session }, error: null };
  }
}

// Create singleton instance
export const localAuthClient = new LocalAuthClient();

// Minimal Supabase-like facade for compatibility in the browser.
// Provides auth methods and a safe stub for data operations to avoid runtime crashes.
type QueryStub = {
  select: (..._args: any[]) => Promise<{ data: any; error: any }> | QueryStub;
  insert: (..._args: any[]) => Promise<{ data: any; error: any }> | QueryStub;
  update: (..._args: any[]) => Promise<{ data: any; error: any }> | QueryStub;
  delete: (..._args: any[]) => Promise<{ data: any; error: any }> | QueryStub;
  eq: (..._args: any[]) => QueryStub;
  order: (..._args: any[]) => QueryStub;
  limit: (..._args: any[]) => QueryStub;
  single: () => Promise<{ data: any; error: any }>;
  maybeSingle: () => Promise<{ data: any; error: any }>;
};

function createQueryStub(table: string): QueryStub {
  const notSupported = async () => ({
    data: null,
    error: { message: `Local Supabase data operations are not supported in browser for table: ${table}` }
  });

  const chain: QueryStub = {
    // Return the chain to allow method chaining like .select().eq().single()
    // Ultimately, terminal calls like single/maybeSingle will resolve safely
    select: () => chain,
    insert: notSupported,
    update: notSupported,
    delete: notSupported,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: notSupported,
    maybeSingle: async () => ({ data: null, error: null })
  };
  return chain;
}

// Export as supabase-like object for compatibility
export const supabase = {
  auth: localAuthClient,
  from: (table: string) => createQueryStub(table)
};

export default supabase;
