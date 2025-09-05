import { getDashboardUrl } from '../dashboard-routing';
import { UserProfile } from '@/hooks/useSecureAuth';

describe('getDashboardUrl', () => {
  it('should return admin panel for admin users regardless of role', () => {
    const profile: UserProfile = {
      id: '1',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'user', // Even with user role
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    expect(getDashboardUrl(true, profile)).toBe('/admin-panel');
  });

  it('should return merchant dashboard for merchant role', () => {
    const profile: UserProfile = {
      id: '2',
      email: 'merchant@test.com',
      full_name: 'Merchant User',
      role: 'merchant',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    expect(getDashboardUrl(false, profile)).toBe('/merchant');
  });

  it('should return user dashboard for customer role', () => {
    const profile: UserProfile = {
      id: '3',
      email: 'customer@test.com',
      full_name: 'Customer User',
      role: 'customer',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    expect(getDashboardUrl(false, profile)).toBe('/user');
  });

  it('should return user dashboard for user role', () => {
    const profile: UserProfile = {
      id: '4',
      email: 'user@test.com',
      full_name: 'Regular User',
      role: 'user',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    expect(getDashboardUrl(false, profile)).toBe('/user');
  });

  it('should return user dashboard for unknown roles', () => {
    const profile: UserProfile = {
      id: '5',
      email: 'unknown@test.com',
      full_name: 'Unknown User',
      role: 'unknown',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    expect(getDashboardUrl(false, profile)).toBe('/user');
  });

  it('should handle null profile', () => {
    expect(getDashboardUrl(false, null)).toBe('/user');
  });

  it('should prioritize isAdmin flag over admin role', () => {
    const profile: UserProfile = {
      id: '6',
      email: 'admin@test.com',
      full_name: 'Admin User',
      role: 'admin',
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };
    
    // Even with admin role, if isAdmin is false, it should check the role
    expect(getDashboardUrl(false, profile)).toBe('/admin-panel');
  });
});