'use client';

import { useState, useEffect } from 'react';

interface SessionUser {
  id: string;
  role: string;
  username: string;
}

interface SessionState {
  authenticated: boolean;
  user: SessionUser | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    authenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setState({ authenticated: true, user: data.user, loading: false });
        } else {
          setState({ authenticated: false, user: null, loading: false });
        }
      } catch {
        setState({ authenticated: false, user: null, loading: false });
      }
    };
    fetchSession();
  }, []);

  return state;
}
