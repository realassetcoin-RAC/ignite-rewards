/**
 * Tests for useSecureAuth hook
 */

import { renderHook } from '@testing-library/react';
import { useSecureAuth } from '../useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

// Mock the admin verification utilities
vi.mock('@/utils/adminVerification', () => ({
  robustAdminCheck: vi.fn(),
  diagnoseAdminIssues: vi.fn(),
}));

// Mock the MFA utilities
vi.mock('@/lib/mfa', () => ({
  canUserUseMFA: vi.fn(),
}));

describe('useSecureAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSecureAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.canUseMFA).toBe(false);
    expect(result.current.mfaEnabled).toBe(false);
    expect(result.current.isWalletUser).toBe(false);
    expect(result.current.isEmailVerified).toBe(false);
    expect(result.current.needsEmailVerification).toBe(false);
  });

  it('should provide signOut function', () => {
    const { result } = renderHook(() => useSecureAuth());
    
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should handle signOut', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockImplementation(mockSignOut);
    
    const { result } = renderHook(() => useSecureAuth());
    
    await result.current.signOut();
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should handle signOut error', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ 
      error: { message: 'Sign out failed' } 
    });
    (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockImplementation(mockSignOut);
    
    const { result } = renderHook(() => useSecureAuth());
    
    await result.current.signOut();
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should set up auth state change listener on mount', () => {
    const mockOnAuthStateChange = vi.fn();
    (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockImplementation(mockOnAuthStateChange);
    
    renderHook(() => useSecureAuth());
    
    expect(mockOnAuthStateChange).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should clean up auth state change listener on unmount', () => {
    const mockUnsubscribe = vi.fn();
    const mockOnAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });
    (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockImplementation(mockOnAuthStateChange);
    
    const { unmount } = renderHook(() => useSecureAuth());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
