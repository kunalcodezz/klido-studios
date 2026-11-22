import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { fetchUserProfile, signOutAdmin } from '../lib/auth';
import type { AppRole, Profile } from '../types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isActiveStaff: boolean;
  isSuperAdmin: boolean;
  canEdit: boolean;
  isReadOnly: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const loadProfileForUser = useCallback(async (userId: string) => {
    try {
      const loaded = await fetchUserProfile(userId);
      setProfile(loaded);
      setError(null);
    } catch (err) {
      setProfile(null);
      setError(err instanceof Error ? err.message : 'Unable to load administrator profile.');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const supabase = getSupabaseClient();

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionErr }) => {
        if (!mounted) return;
        if (sessionErr) {
          setError(sessionErr.message);
          setLoading(false);
          return;
        }
        setSession(data.session);
        if (data.session?.user) {
          await loadProfileForUser(data.session.user.id);
        } else {
          setProfile(null);
        }
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize auth session.');
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfileForUser(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForUser]);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadProfileForUser(session.user.id);
    }
  }, [session?.user?.id, loadProfileForUser]);

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const active = Boolean(session?.user && profile?.is_active);
    const role = active && profile ? profile.role : null;

    return {
      session,
      user: session?.user ?? null,
      profile,
      role,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      isActiveStaff: active,
      isSuperAdmin: role === 'SUPER_ADMIN',
      canEdit: role === 'SUPER_ADMIN' || role === 'EDITOR',
      isReadOnly: role === 'VIEWER',
      refreshProfile,
      signOut,
    };
  }, [session, profile, loading, error, refreshProfile, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
