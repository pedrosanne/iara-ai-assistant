
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import type { BusinessProfile } from '@/contexts/AuthContext';

const CompanyForm = () => {
  const { user, businessProfile, refreshBusinessProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    tone: 'friendly' as 'formal' | 'casual' | 'friendly' | 'professional',
    ai_name: 'IARA',
    ai_personality: '',
    whatsapp_token: '',
    whatsapp_phone_id: '',
    webhook_verify_token: ''
  });

  useEffect(() => {
    if (businessProfile) {
      setFormData({
        name: businessProfile.name || '',
        description: businessProfile.description || '',
        industry: businessProfile.industry || '',
        tone: businessProfile.tone,
        ai_name: businessProfile.ai_name,
        ai_personality: businessProfile.ai_personality || '',
        whatsapp_token: businessProfile.whatsapp_token || '',
        whatsapp_phone_id: businessProfile.whatsapp_phone_id || '',
        webhook_verify_token: businessProfile.webhook_verify_token || ''
      });
    }
  }, [businessProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (businessProfile) {
        // Update existing business profile
        const { error } = await supabase
          .from('business_profiles')
          .update({
            name: formData.name,
            description: formData.description,
            industry: formData.industry,
            tone: formData.tone,
            ai_name: formData.ai_name,
            ai_personality: formData.ai_personality,
            whatsapp_token: formData.whatsapp_token,
            whatsapp_phone_id: formData.whatsapp_phone_id,
            webhook_verify_token: formData.webhook_verify_token
          })
          .eq('id', businessProfile.id);

        if (error) throw error;
      } else {
        // Create new business profile
        const { error } = await supabase
          .from('business_profiles')
          .insert([{
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            industry: formData.industry,
            tone: formData.tone,
            ai_name: formData.ai_name,
            ai_personality: formData.ai_personality,
            whatsapp_token: formData.whatsapp_token,
            whatsapp_phone_id: formData.whatsapp_phone_id,
            webhook_verify_token: formData.webhook_verify_token || generateVerifyToken()
          }]);

        if (error) throw error;
      }

      await refreshBusinessProfile();
      toast({
        title: 'Sucesso!',
        description: 'Configurações da empresa atualizadas com sucesso.',
      });
    } catch (error: any) {
      console.error('Error saving business profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateVerifyToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuração da Empresa</h1>
        <p className="text-muted-foreground">Configure as informações da sua empresa para personalizar a IARA</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Informações Gerais</TabsTrigger>
          <TabsTrigger value="ai">Configuração da IA</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações básicas sobre seu negócio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Loja do João"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva brevemente seu negócio..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Setor/Ramo</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="Ex: Varejo, Serviços, E-commerce"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalidade da IA</CardTitle>
                <CardDescription>Configure como a IARA vai se comportar com seus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai_name">Nome da IA</Label>
                  <Input
                    id="ai_name"
                    value={formData.ai_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, ai_name: e.target.value }))}
                    placeholder="IARA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tom de Voz</Label>
                  <Select value={formData.tone} onValueChange={(value: 'formal' | 'casual' | 'friendly' | 'professional') => setFormData(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tom de voz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_personality">Personalidade da IA</Label>
                  <Textarea
                    id="ai_personality"
                    value={formData.ai_personality}
                    onChange={(e) => setFormData(prev => ({ ...prev, ai_personality: e.target.value }))}
                    placeholder="Descreva como a IA deve se comportar, suas características principais..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integração WhatsApp</CardTitle>
                <CardDescription>Configure a conexão com o WhatsApp Business API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_token">Token de Acesso do WhatsApp</Label>
                  <Input
                    id="whatsapp_token"
                    type="password"
                    value={formData.whatsapp_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_token: e.target.value }))}
                    placeholder="Token obtido no Meta for Developers"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_phone_id">ID do Telefone</Label>
                  <Input
                    id="whatsapp_phone_id"
                    value={formData.whatsapp_phone_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_phone_id: e.target.value }))}
                    placeholder="Phone Number ID do WhatsApp Business"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook_verify_token">Token de Verificação do Webhook</Label>
                  <Input
                    id="webhook_verify_token"
                    value={formData.webhook_verify_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
                    placeholder="Token para verificação do webhook"
                  />
                  <p className="text-sm text-muted-foreground">
                    URL do Webhook: https://pzgkozweshaucfbfdorz.supabase.co/functions/v1/whatsapp-webhook
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
};

export default CompanyForm;
