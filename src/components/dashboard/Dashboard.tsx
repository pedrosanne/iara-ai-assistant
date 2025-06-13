
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Bot,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { businessProfile } = useAuth();

  const stats = [
    {
      title: 'Conversas Hoje',
      value: '24',
      change: '+12%',
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      title: 'Leads Gerados',
      value: '8',
      change: '+25%',
      icon: Users,
      color: 'text-green-500'
    },
    {
      title: 'Taxa de Conversão',
      value: '33%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-orange-500'
    },
    {
      title: 'IA Ativa',
      value: businessProfile?.name ? 'Online' : 'Offline',
      change: businessProfile?.name ? 'Configurada' : 'Pendente',
      icon: Bot,
      color: businessProfile?.name ? 'text-green-500' : 'text-red-500'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'conversation',
      message: 'Nova conversa iniciada com +55 11 99999-9999',
      time: '2 min atrás',
      status: 'active'
    },
    {
      id: 2,
      type: 'lead',
      message: 'Lead qualificado: interesse em produto X',
      time: '15 min atrás',
      status: 'success'
    },
    {
      id: 3,
      type: 'config',
      message: 'Configuração da IA atualizada',
      time: '1 hora atrás',
      status: 'info'
    },
    {
      id: 4,
      type: 'error',
      message: 'Falha na integração WhatsApp - verificar',
      time: '2 horas atrás',
      status: 'error'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return MessageSquare;
      case 'lead':
        return Users;
      case 'config':
        return Bot;
      case 'error':
        return AlertCircle;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'info':
        return 'text-orange-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da sua IA de atendimento
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className={`text-xs ${stat.color}`}>
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status da IA */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Status da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">WhatsApp Integration</p>
                <p className="text-sm text-muted-foreground">Não configurado</p>
              </div>
              <div className="h-3 w-3 bg-red-500 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Base de Conhecimento</p>
                <p className="text-sm text-muted-foreground">
                  Produtos configurados
                </p>
              </div>
              <div className="h-3 w-3 bg-yellow-500 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Personalidade da IA</p>
                <p className="text-sm text-muted-foreground">
                  {businessProfile?.ai_name || 'Não configurado'}
                </p>
              </div>
              <div className={`h-3 w-3 rounded-full ${
                businessProfile?.ai_name ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${getStatusColor(activity.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Checklist */}
      {!businessProfile?.name && (
        <Card className="bg-card border-border border-primary/50">
          <CardHeader>
            <CardTitle className="text-primary">Configuração Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Conta criada</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Configure os dados da empresa</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Adicione produtos ao catálogo</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Configure a personalidade da IA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
