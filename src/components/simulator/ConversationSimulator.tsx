
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Send, Bot, User, Loader2, MessageCircle, RefreshCw, Mic, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ConversationSimulator = () => {
  const { businessProfile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [contextInfo, setContextInfo] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (businessProfile && messages.length === 0) {
      initializeConversation();
    }
  }, [businessProfile]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeConversation = async () => {
    if (!businessProfile) return;

    // Create a simulation conversation
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([{
          business_id: businessProfile.id,
          whatsapp_contact_id: 'simulator_' + Date.now(),
          contact_phone: 'simulator',
          contact_name: 'Simulador',
          status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);
      
      // Add welcome message
      setMessages([{
        id: '1',
        content: `Olá! Eu sou a ${businessProfile.ai_name}, assistente virtual da ${businessProfile.name}. Como posso ajudar você hoje?`,
        sender: 'ai',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to simple welcome without conversation tracking
      setMessages([{
        id: '1',
        content: `Olá! Eu sou a ${businessProfile.ai_name}, assistente virtual da ${businessProfile.name}. Como posso ajudar você hoje?`,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !businessProfile || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the new AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          business_id: businessProfile.id,
          message: userMessage.content,
          conversation_id: conversationId
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setContextInfo(data.context_used);

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Erro na conversa',
        description: 'Não foi possível processar sua mensagem: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    setMessages([]);
    setConversationId(null);
    setContextInfo(null);
    await initializeConversation();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulador de Conversa</h1>
          <p className="text-muted-foreground">Configure sua empresa primeiro para testar a IARA</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configure sua empresa</h3>
            <p className="text-muted-foreground text-center">
              Antes de testar a conversa, você precisa configurar as informações da sua empresa na seção "Configuração da Empresa".
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulador de Conversa</h1>
          <p className="text-muted-foreground">Teste como a IARA responderá aos seus clientes com dados reais</p>
        </div>
        
        <Button variant="outline" onClick={clearConversation} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Nova Conversa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Conversa com {businessProfile.ai_name}
                {contextInfo && (
                  <Badge variant="secondary" className="ml-2">
                    IA Real com DeepSeek
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Simulação real com seus dados cadastrados
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        
                        <div className={`rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 opacity-70`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Processando com DeepSeek...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">Nome</div>
                <div className="text-sm text-muted-foreground">{businessProfile.ai_name}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium">Tom de Voz</div>
                <Badge variant="secondary">{businessProfile.tone}</Badge>
              </div>
              
              <div>
                <div className="text-sm font-medium">Empresa</div>
                <div className="text-sm text-muted-foreground">{businessProfile.name}</div>
              </div>

              <div>
                <div className="text-sm font-medium">Motor de IA</div>
                <Badge variant="outline">DeepSeek Chat</Badge>
              </div>
            </CardContent>
          </Card>

          {contextInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contexto Usado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Produtos:</span>
                  <Badge variant="secondary">{contextInfo.products_count}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Políticas:</span>
                  <Badge variant="secondary">{contextInfo.policies_count}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Promoções:</span>
                  <Badge variant="secondary">{contextInfo.promotions_count}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Histórico:</span>
                  <Badge variant="secondary">{contextInfo.conversation_history_count}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exemplos de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• "Quais produtos vocês têm?"</p>
              <p>• "Qual é o preço do [produto]?"</p>
              <p>• "Vocês têm alguma promoção?"</p>
              <p>• "Como funciona a entrega?"</p>
              <p>• "Qual é a política de troca?"</p>
              <p>• "Gostaria de fazer um pedido"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationSimulator;
