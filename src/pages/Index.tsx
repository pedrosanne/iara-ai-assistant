
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import CompanyForm from '@/components/company/CompanyForm';
import ProductManager from '@/components/products/ProductManager';
import ConversationSimulator from '@/components/simulator/ConversationSimulator';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  console.log('Index: Render state - isLoading:', isLoading, 'user:', user?.id || 'none');

  if (isLoading) {
    console.log('Index: Showing loading screen');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('Index: User not authenticated, showing login form');
    return (
      <LoginForm 
        onToggleMode={() => setIsRegisterMode(!isRegisterMode)}
        isRegisterMode={isRegisterMode}
      />
    );
  }

  console.log('Index: User authenticated, showing dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'company':
        return <CompanyForm />;
      case 'products':
        return <ProductManager />;
      case 'simulator':
        return <ConversationSimulator />;
      case 'policies':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Políticas da Empresa</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'ai-config':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Configuração da IA</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'working-hours':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Horários de Funcionamento</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'conversations':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Histórico de Conversas</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
