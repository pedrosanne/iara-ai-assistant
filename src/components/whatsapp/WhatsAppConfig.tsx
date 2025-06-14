
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Phone, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

const WhatsAppConfig = () => {
  const { businessProfile } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState({
    whatsapp_phone_id: '',
    whatsapp_token: '',
    webhook_verify_token: '',
    is_configured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const webhookUrl = `${window.location.origin.replace('localhost:5173', 'pzgkozweshaucfbfdorz.supabase.co')}/functions/v1/whatsapp-webhook`;

  useEffect(() => {
    if (businessProfile) {
      loadWhatsAppConfig();
    }
  }, [businessProfile]);

  const loadWhatsAppConfig = async () => {
    if (!businessProfile) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('whatsapp_phone_id, whatsapp_token, webhook_verify_token')
        .eq('id', businessProfile.id)
        .single();

      if (error) throw error;

      setConfig({
        whatsapp_phone_id: data.whatsapp_phone_id || '',
        whatsapp_token: data.whatsapp_token || '',
        webhook_verify_token: data.webhook_verify_token || '',
        is_configured: !!(data.whatsapp_phone_id && data.whatsapp_token && data.webhook_verify_token)
      });

    } catch (error: any) {
      console.error('Error loading WhatsApp config:', error);
      toast({
        title: 'Erro ao carregar configuração',
        description: 'Não foi possível carregar as configurações do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWhatsAppConfig = async () => {
    if (!businessProfile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          whatsapp_phone_id: config.whatsapp_phone_id,
          whatsapp_token: config.whatsapp_token,
          webhook_verify_token: config.webhook_verify_token
        })
        .eq('id', businessProfile.id);

      if (error) throw error;

      setConfig(prev => ({ ...prev, is_configured: !!(config.whatsapp_phone_id && config.whatsapp_token && config.webhook_verify_token) }));

      toast({
        title: 'Configuração salva',
        description: 'As configurações do WhatsApp foram salvas com sucesso',
      });

    } catch (error: any) {
      console.error('Error saving WhatsApp config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência`,
    });
  };

  const testWebhook = async () => {
    if (!config.webhook_verify_token) {
      toast({
        title: 'Configure primeiro',
        description: 'Configure o token de verificação antes de testar',
        variant: 'destructive',
      });
      return;
    }

    try {
      const testUrl = `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${config.webhook_verify_token}&hub.challenge=test123`;
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const result = await response.text();
        if (result === 'test123') {
          toast({
            title: 'Webhook funcionando!',
            description: 'O webhook está configurado corretamente',
          });
        }
      } else {
        throw new Error('Webhook não respondeu corretamente');
      }
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: 'O webhook não está funcionando corretamente',
        variant: 'destructive',
      });
    }
  };

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuração WhatsApp</h1>
          <p className="text-muted-foreground">Configure sua empresa primeiro</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configure sua empresa</h3>
            <p className="text-muted-foreground text-center">
              Antes de configurar o WhatsApp, você precisa configurar as informações da sua empresa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuração WhatsApp</h1>
          <p className="text-muted-foreground">Configure a integração com WhatsApp Business API</p>
        </div>
        
        {config.is_configured && (
          <Badge variant="default" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Configurado
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Configure suas credenciais do WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-id">Phone Number ID</Label>
                <Input
                  id="phone-id"
                  placeholder="Ex: 123456789012345"
                  value={config.whatsapp_phone_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, whatsapp_phone_id: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Ex: EAAxxxxxxxxxxxxxxx"
                  value={config.whatsapp_token}
                  onChange={(e) => setConfig(prev => ({ ...prev, whatsapp_token: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-token">Verify Token</Label>
                <Input
                  id="verify-token"
                  placeholder="Ex: iara-verify-token"
                  value={config.webhook_verify_token}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Token personalizado para validação do webhook
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveWhatsAppConfig} 
                  disabled={isSaving || isLoading}
                  className="flex-1"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={testWebhook}
                  disabled={!config.webhook_verify_token}
                >
                  Testar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Webhook</CardTitle>
              <CardDescription>
                URL para configurar no Meta Developers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={webhookUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Verify Token</Label>
                <div className="flex gap-2">
                  <Input 
                    value={config.webhook_verify_token || 'Configure primeiro'} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(config.webhook_verify_token, 'Verify Token')}
                    disabled={!config.webhook_verify_token}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Meta Developers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções de Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">1. Criar App no Meta</h4>
                <p className="text-muted-foreground">
                  Acesse developers.facebook.com e crie um novo app Business
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">2. Adicionar WhatsApp</h4>
                <p className="text-muted-foreground">
                  Adicione o produto "WhatsApp" ao seu app
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">3. Configurar Webhook</h4>
                <p className="text-muted-foreground">
                  Use a URL e token acima para configurar o webhook
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">4. Obter Credenciais</h4>
                <p className="text-muted-foreground">
                  Copie o Phone Number ID e Access Token gerados
                </p>
              </div>
            </CardContent>
          </Card>

          {!config.is_configured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete a configuração para começar a receber mensagens do WhatsApp.
                Você precisará configurar o webhook no Meta Developers Console.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
