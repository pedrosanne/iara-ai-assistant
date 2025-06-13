
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
  aiName: string;
  aiPersonality: string;
  products: Product[];
  policies: Policy[];
  workingHours: WorkingHours;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category: string;
}

export interface Policy {
  id: string;
  type: 'delivery' | 'exchange' | 'payment' | 'warranty' | 'general';
  title: string;
  description: string;
}

export interface WorkingHours {
  monday: { start: string; end: string; active: boolean };
  tuesday: { start: string; end: string; active: boolean };
  wednesday: { start: string; end: string; active: boolean };
  thursday: { start: string; end: string; active: boolean };
  friday: { start: string; end: string; active: boolean };
  saturday: { start: string; end: string; active: boolean };
  sunday: { start: string; end: string; active: boolean };
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateCompany: (company: Partial<Company>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simular carregamento inicial
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('iara_user');
      const savedCompany = localStorage.getItem('iara_company');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedCompany) {
        setCompany(JSON.parse(savedCompany));
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      companyId: '1'
    };
    
    const mockCompany: Company = {
      id: '1',
      name: 'Minha Empresa',
      description: 'Empresa focada em vendas',
      industry: 'Varejo',
      tone: 'friendly',
      aiName: 'IARA',
      aiPersonality: 'Assistente virtual amigável e focada em vendas',
      products: [],
      policies: [],
      workingHours: {
        monday: { start: '08:00', end: '18:00', active: true },
        tuesday: { start: '08:00', end: '18:00', active: true },
        wednesday: { start: '08:00', end: '18:00', active: true },
        thursday: { start: '08:00', end: '18:00', active: true },
        friday: { start: '08:00', end: '18:00', active: true },
        saturday: { start: '08:00', end: '14:00', active: true },
        sunday: { start: '08:00', end: '14:00', active: false }
      }
    };

    setUser(mockUser);
    setCompany(mockCompany);
    
    localStorage.setItem('iara_user', JSON.stringify(mockUser));
    localStorage.setItem('iara_company', JSON.stringify(mockCompany));
    
    setIsLoading(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      name,
      companyId: '1'
    };
    
    setUser(mockUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem('iara_user');
    localStorage.removeItem('iara_company');
  };

  const updateCompany = async (updatedCompany: Partial<Company>) => {
    if (!company) return;
    
    const newCompany = { ...company, ...updatedCompany };
    setCompany(newCompany);
    localStorage.setItem('iara_company', JSON.stringify(newCompany));
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      login,
      logout,
      register,
      updateCompany,
      isLoading
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
