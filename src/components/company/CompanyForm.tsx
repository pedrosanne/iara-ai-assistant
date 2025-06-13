
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';

const CompanyForm: React.FC = () => {
  const { company, updateCompany } = useAuth();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    description: company?.description || '',
    industry: company?.industry || '',
    tone: company?.tone || 'friendly'
  });
  const [isLoading, setIsLoading] = useState(false);

  const industries = [
    'Varejo',
    'Alimentação',
    'Moda',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Serviços',
    'Imobiliário',
    'Automotivo',
    'Beleza',
    'Fitness',
    'Consultoria',
    'Outros'
  ];

  const tones = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'professional', label: 'Profissional' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateCompany(formData);
      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar dados da empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Configuração da Empresa</h1>
        <p className="text-muted-foreground">
          Configure os dados básicos da sua empresa para personalizar a IA
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Loja do João"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Setor de Atuação *</Label>
                <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Empresa *</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua empresa, seus produtos/serviços principais e diferenciais..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                className="bg-input border-border min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground">
                Essa descrição será usada pela IA para entender melhor seu negócio
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tom de Comunicação</Label>
              <Select value={formData.tone} onValueChange={(value) => handleChange('tone', value)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Define como a IA se comunicará com seus clientes
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview */}
      {formData.name && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Preview da IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Exemplo de como a IA se apresentará:</p>
              <p className="text-foreground">
                "Olá! Eu sou a IARA, assistente virtual da {formData.name}. 
                {formData.description && ` Somos uma empresa ${formData.industry.toLowerCase()} focada em ${formData.description.substring(0, 50)}...`}
                Como posso ajudá-lo hoje?"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyForm;
