
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home, 
  Building2, 
  Package, 
  MessageCircle, 
  Users, 
  Settings,
  FileText,
  Tag,
  Bot,
  Phone,
  BarChart3
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Visão geral e estatísticas'
  },
  {
    id: 'company',
    label: 'Configuração da Empresa',
    icon: Building2,
    description: 'Dados da empresa e IA'
  },
  {
    id: 'products',
    label: 'Produtos e Serviços',
    icon: Package,
    description: 'Catálogo de produtos'
  },
  {
    id: 'policies',
    label: 'Políticas Comerciais',
    icon: FileText,
    description: 'Regras e políticas'
  },
  {
    id: 'promotions',
    label: 'Promoções',
    icon: Tag,
    description: 'Ofertas e descontos'
  },
  {
    id: 'simulator',
    label: 'Simulador de Conversa',
    icon: Bot,
    description: 'Teste a IA real'
  },
  {
    id: 'leads',
    label: 'Gestão de Leads',
    icon: Users,
    description: 'Clientes potenciais'
  },
  {
    id: 'conversations',
    label: 'Conversas WhatsApp',
    icon: MessageCircle,
    description: 'Histórico de conversas'
  },
  {
    id: 'whatsapp',
    label: 'Configuração WhatsApp',
    icon: Phone,
    description: 'Integração WhatsApp'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Relatórios e métricas'
  }
];

export function Sidebar({ className, activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">IARA AI</h2>
              <p className="text-xs text-muted-foreground">Assistente Inteligente</p>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto p-3",
                      activeSection === item.id && "bg-secondary"
                    )}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
