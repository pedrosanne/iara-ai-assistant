
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface BusinessProfile {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  industry?: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  ai_name: string;
  ai_personality?: string;
  whatsapp_token?: string;
  whatsapp_phone_id?: string;
  webhook_verify_token?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: number;
  stock: number;
  image_url?: string;
  category?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  id: string;
  business_id: string;
  type: 'delivery' | 'exchange' | 'payment' | 'warranty' | 'general';
  title: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  discount_amount?: number;
  valid_from: string;
  valid_until?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIConfig {
  id: string;
  business_id: string;
  voice_id?: string;
  voice_provider: string;
  response_style: 'concise' | 'balanced' | 'detailed';
  enable_audio: boolean;
  enable_buttons: boolean;
  fallback_message: string;
  transfer_keywords: string[];
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  businessProfile: BusinessProfile | null;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshBusinessProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth...');
    
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: User authenticated, fetching profile...');
          // Defer the business profile fetch to avoid blocking the auth state update
          setTimeout(() => {
            if (mounted) {
              fetchBusinessProfile(session.user.id);
            }
          }, 100);
        } else {
          console.log('AuthProvider: User logged out');
          setBusinessProfile(null);
        }
        
        // Always set loading to false after processing auth state
        setIsLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log('AuthProvider: Initial session check:', session?.user?.id ? 'Found session' : 'No session');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchBusinessProfile(session.user.id);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchBusinessProfile = async (userId: string) => {
    try {
      console.log('AuthProvider: Fetching business profile for user:', userId);
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('AuthProvider: Error fetching business profile:', error);
        return;
      }
      
      if (data) {
        const profile: BusinessProfile = {
          ...data,
          tone: data.tone as 'formal' | 'casual' | 'friendly' | 'professional'
        };
        console.log('AuthProvider: Business profile loaded:', profile.name);
        setBusinessProfile(profile);
      } else {
        console.log('AuthProvider: No business profile found');
        setBusinessProfile(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error fetching business profile:', error);
    }
  };

  const refreshBusinessProfile = async () => {
    if (user) {
      await fetchBusinessProfile(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthProvider: Login error:', error);
      } else {
        console.log('AuthProvider: Login successful:', data.user?.id);
      }
      
      return { error };
    } catch (error) {
      console.error('AuthProvider: Login exception:', error);
      return { error };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthProvider: Attempting registration for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name
          }
        }
      });

      if (error) {
        console.error('AuthProvider: Registration error:', error);
        return { error };
      }

      console.log('AuthProvider: Registration successful:', data.user?.id);

      // Create user in the users table
      if (data.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              password_hash: '',
              name: name
            }
          ]);

        if (userError) {
          console.error('AuthProvider: Error creating user profile:', userError);
        }
      }

      return { error };
    } catch (error) {
      console.error('AuthProvider: Registration exception:', error);
      return { error };
    }
  };

  const logout = async () => {
    console.log('AuthProvider: Logging out...');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      businessProfile,
      login,
      register,
      logout,
      isLoading,
      refreshBusinessProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
