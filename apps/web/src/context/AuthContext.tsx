import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns true if the account needs email confirmation before it can sign in
   * (depends on the Supabase project's "Confirm email" auth setting). */
  signup: (email: string, password: string, name: string) => Promise<{ needsEmailConfirmation: boolean }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(supaUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  return {
    id: supaUser.id,
    email: supaUser.email ?? '',
    name: (supaUser.user_metadata?.name as string) || supaUser.email?.split('@')[0] || 'You',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? toUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toUser(session.user) : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signup: async (email, password, name) => {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    forgotPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    resetPassword: async (newPassword) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
