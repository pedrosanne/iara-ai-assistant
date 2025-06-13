
import React from 'react';
import { 
  Bot, 
  Building2, 
  Package, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Brain,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const { user, company, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'policies', label: 'Políticas', icon: FileText },
    { id: 'ai-config', label: 'IA Config', icon: Brain },
    { id: 'working-hours', label: 'Horários', icon: Clock },
    { id: 'conversations', label: 'Conversas', icon: MessageSquare },
    { id: 'simulator', label: 'Simulador', icon: Bot },
  ];

  return (
    <div className="w-64 bg-sidebar h-screen flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">IARA</h1>
            <p className="text-sm text-sidebar-foreground/70">IA de Relacionamento</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="text-sm">
          <p className="font-medium text-sidebar-foreground">{user?.name}</p>
          <p className="text-sidebar-foreground/70">{company?.name || 'Empresa não configurada'}</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={() => onSectionChange('settings')}
          variant="ghost"
          className="w-full justify-start mb-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configurações
        </Button>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
