
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchBusinessProfile(session.user.id);
          }, 0);
        } else {
          setBusinessProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchBusinessProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchBusinessProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching business profile:', error);
        return;
      }
      
      // Type assertion to ensure proper typing from database
      if (data) {
        const profile: BusinessProfile = {
          ...data,
          tone: data.tone as 'formal' | 'casual' | 'friendly' | 'professional'
        };
        setBusinessProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const refreshBusinessProfile = async () => {
    if (user) {
      await fetchBusinessProfile(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
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

      if (error) return { error };

      // Criar usuário na tabela users
      if (data.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              password_hash: '', // Será gerenciado pelo Supabase Auth
              name: name
            }
          ]);

        if (userError) {
          console.error('Error creating user profile:', userError);
        }
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const logout = async () => {
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
