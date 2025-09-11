import { useMemo } from 'react';

type SimpleUser = {
  id: string;
  email?: string;
};

export function useUser(): { user: SimpleUser | null } {
  // Placeholder implementation until real auth is wired.
  // Tries to read a user id from localStorage for demo purposes.
  const user = useMemo<SimpleUser | null>(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('demo_user_id') : null;
      if (stored && stored.length > 0) {
        return { id: stored };
      }
    } catch {
      // ignore
    }
    return { id: 'demo-user' };
  }, []);

  return { user };
}




