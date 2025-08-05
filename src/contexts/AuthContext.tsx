import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string, profileType?: 'office' | 'vezetoi') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
      } else {
        console.log('Sign in successful:', data.user?.email);
      }
      
      return { error };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, name?: string, profileType: 'office' | 'vezetoi' = 'office') => {
    try {
      console.log('Attempting sign up for:', email, 'with name:', name, 'profile type:', profileType);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || '',
            profile_type: profileType,
          },
          // Disable email confirmation for internal tool
          emailRedirectTo: undefined,
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
      } else {
        console.log('Sign up successful:', data.user?.email);
        // Check if user needs email confirmation
        if (data.user && !data.session) {
          console.log('User created but needs email confirmation');
        }
      }
      
      return { error };
    } catch (err) {
      console.error('Sign up exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      // Clear company access when signing out
      sessionStorage.removeItem('company-access');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
    } catch (err) {
      console.error('Sign out exception:', err);
    }
  };

  const updateProfile = async (data: { name?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data,
      });
      return { error };
    } catch (err) {
      console.error('Update profile exception:', err);
      return { error: err };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};