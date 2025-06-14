
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Search, Phone, MessageCircle, User, Calendar, Filter, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Lead {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  interest_level: string;
  interested_products: string[] | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const LeadsManager = () => {
  const { businessProfile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    interest_level: 'low',
    interested_products: '',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (businessProfile) {
      fetchLeads();
    }
  }, [businessProfile]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, filterLevel]);

  const fetchLeads = async () => {
    if (!businessProfile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', businessProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_phone.includes(searchTerm) ||
        lead.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(lead => lead.interest_level === filterLevel);
    }

    setFilteredLeads(filtered);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProfile) return;

    try {
      const leadData = {
        business_id: businessProfile.id,
        contact_name: formData.contact_name || null,
        contact_phone: formData.contact_phone,
        interest_level: formData.interest_level,
        interested_products: formData.interested_products ? formData.interested_products.split(',').map(p => p.trim()) : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        notes: formData.notes || null
      };

      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', editingLead.id);

        if (error) throw error;
        toast({ title: 'Lead atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;
        toast({ title: 'Lead adicionado com sucesso!' });
      }

      setIsDialogOpen(false);
      setEditingLead(null);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar lead',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      contact_name: '',
      contact_phone: '',
      interest_level: 'low',
      interested_products: '',
      tags: '',
      notes: ''
    });
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      contact_name: lead.contact_name || '',
      contact_phone: lead.contact_phone,
      interest_level: lead.interest_level,
      interested_products: lead.interested_products?.join(', ') || '',
      tags: lead.tags?.join(', ') || '',
      notes: lead.notes || ''
    });
    setIsDialogOpen(true);
  };

  const getInterestLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case '1low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterestLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return level;
    }
  };

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Leads</h1>
          <p className="text-muted-foreground">Configure sua empresa primeiro</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Leads</h1>
          <p className="text-muted-foreground">Gerencie seus potenciais clientes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingLead(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
              <DialogDescription>
                {editingLead ? 'Atualize as informações do lead' : 'Adicione um novo lead potencial'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <Label htmlFor="contact_name">Nome do Contato</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Telefone *</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <Label htmlFor="interest_level">Nível de Interesse</Label>
                <Select value={formData.interest_level} onValueChange={(value) => setFormData({ ...formData, interest_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interested_products">Produtos de Interesse</Label>
                <Input
                  id="interested_products"
                  value={formData.interested_products}
                  onChange={(e) => setFormData({ ...formData, interested_products: e.target.value })}
                  placeholder="Produto 1, Produto 2"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="whatsapp, promoção, indicação"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações sobre o lead..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingLead ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="high">Alto interesse</SelectItem>
            <SelectItem value="medium">Médio interesse</SelectItem>
            <SelectItem value="low">Baixo interesse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alto Interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {leads.filter(l => l.interest_level === 'high').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Médio Interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leads.filter(l => l.interest_level === 'medium').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Baixo Interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.interest_level === 'low').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando leads...</div>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || filterLevel !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Adicione seu primeiro lead para começar'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {lead.contact_name || 'Nome não informado'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {lead.contact_phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getInterestLevelColor(lead.interest_level)}>
                      {getInterestLevelText(lead.interest_level)}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(lead)}>
                      Editar
                    </Button>
                  </div>
                </div>

                {lead.interested_products && lead.interested_products.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Produtos de interesse:</p>
                    <div className="flex flex-wrap gap-1">
                      {lead.interested_products.map((product, index) => (
                        <Badge key={index} variant="outline">{product}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lead.tags && lead.tags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lead.notes && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Observações:</p>
                    <p className="text-sm text-muted-foreground">{lead.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {lead.updated_at !== lead.created_at && (
                    <div>
                      Atualizado em {new Date(lead.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadsManager;
