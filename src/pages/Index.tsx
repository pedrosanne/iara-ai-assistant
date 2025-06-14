import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import Dashboard from '@/components/dashboard/Dashboard';
import CompanyForm from '@/components/company/CompanyForm';
import ProductManager from '@/components/products/ProductManager';
import ConversationSimulator from '@/components/simulator/ConversationSimulator';
import LeadsManager from '@/components/leads/LeadsManager';
import WhatsAppConfig from '@/components/whatsapp/WhatsAppConfig';
import LoginForm from '@/components/auth/LoginForm';

const Index = () => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm 
        onToggleMode={() => setIsRegisterMode(!isRegisterMode)}
        isRegisterMode={isRegisterMode}
      />
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'company':
        return <CompanyForm />;
      case 'products':
        return <ProductManager />;
      case 'policies':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Políticas Comerciais</h1>
              <p className="text-muted-foreground">Gerencie suas políticas de entrega, troca, pagamento e garantias</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        );
      case 'promotions':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Promoções</h1>
              <p className="text-muted-foreground">Gerencie suas ofertas e campanhas promocionais</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        );
      case 'simulator':
        return <ConversationSimulator />;
      case 'leads':
        return <LeadsManager />;
      case 'conversations':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Conversas WhatsApp</h1>
              <p className="text-muted-foreground">Histórico completo de conversas com clientes</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        );
      case 'whatsapp':
        return <WhatsAppConfig />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
              <p className="text-muted-foreground">Relatórios e métricas de desempenho</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <div className="hidden lg:block w-80 border-r bg-card">
          <Sidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection}
            className="h-screen"
          />
        </div>
        
        <div className="flex-1">
          <main className="p-6 lg:p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
