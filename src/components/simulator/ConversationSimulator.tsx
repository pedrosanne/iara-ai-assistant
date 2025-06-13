
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, User, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

const ConversationSimulator: React.FC = () => {
  const { company } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar conversa com mensagem de boas-vindas
  useEffect(() => {
    if (company?.name && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Olá! Eu sou a ${company.aiName || 'IARA'}, assistente virtual da ${company.name}. ${company.description ? `Somos uma empresa do setor ${company.industry} focada em ${company.description.substring(0, 100)}...` : ''} Como posso ajudá-lo hoje?`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [company]);

  const generateAIResponse = (userMessage: string): string => {
    if (!company) {
      return "Desculpe, ainda não tenho informações sobre a empresa configuradas.";
    }

    const lowerMessage = userMessage.toLowerCase();
    
    // Respostas baseadas em palavras-chave
    if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('quanto custa')) {
      if (company.products && company.products.length > 0) {
        const productList = company.products
          .slice(0, 3)
          .map(p => `• ${p.name}: R$ ${p.price.toFixed(2)}`)
          .join('\n');
        return `Aqui estão alguns dos nossos produtos:\n\n${productList}\n\nGostaria de saber mais sobre algum produto específico?`;
      }
      return "Posso ajudar com informações sobre preços! Quais produtos você tem interesse?";
    }

    if (lowerMessage.includes('produto') || lowerMessage.includes('catálogo') || lowerMessage.includes('o que vocês vendem')) {
      if (company.products && company.products.length > 0) {
        const productList = company.products
          .slice(0, 5)
          .map(p => `• ${p.name}${p.category ? ` (${p.category})` : ''}`)
          .join('\n');
        return `Temos ótimos produtos disponíveis:\n\n${productList}\n\nQual desses produtos chamou sua atenção?`;
      }
      return "Estamos organizando nosso catálogo! Em breve teremos mais informações sobre nossos produtos.";
    }

    if (lowerMessage.includes('horário') || lowerMessage.includes('funcionamento') || lowerMessage.includes('aberto')) {
      return "Nosso horário de funcionamento é de segunda a sexta das 8h às 18h, e aos sábados das 8h às 14h. Posso ajudar com mais alguma coisa?";
    }

    if (lowerMessage.includes('entrega') || lowerMessage.includes('frete')) {
      return "Fazemos entregas em toda a região! O prazo varia de acordo com a localização. Você gostaria de saber o prazo para o seu endereço?";
    }

    if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde')) {
      return `Olá! Seja bem-vindo à ${company.name}! Como posso ajudá-lo hoje? Posso falar sobre nossos produtos, preços, horários ou tirar qualquer dúvida.`;
    }

    if (lowerMessage.includes('obrigado') || lowerMessage.includes('valeu') || lowerMessage.includes('tchau')) {
      return "Foi um prazer ajudar! Se precisar de mais alguma coisa, estarei aqui. Tenha um ótimo dia! 😊";
    }

    // Resposta padrão personalizada
    const tone = company.tone === 'formal' ? 'formal' : 'amigável';
    if (tone === 'formal') {
      return "Agradeço seu contato. Como posso auxiliá-lo com informações sobre nossos produtos e serviços?";
    }
    
    return "Interessante! Conte-me mais sobre o que você está procurando. Tenho certeza de que posso ajudar! 😊";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simular delay de processamento da IA
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // 1-2 segundos de delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!company?.name) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulador de Conversas</h1>
          <p className="text-muted-foreground">
            Teste como a IA responderá aos clientes
          </p>
        </div>
        
        <Card className="bg-card border-border border-yellow-500/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configure sua empresa primeiro</h3>
            <p className="text-muted-foreground text-center">
              Para usar o simulador, você precisa configurar os dados da sua empresa e adicionar produtos ao catálogo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Simulador de Conversas</h1>
        <p className="text-muted-foreground">
          Teste como a {company.aiName || 'IARA'} responderá aos seus clientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <Card className="bg-card border-border h-[600px] flex flex-col">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Conversa com {company.aiName || 'IARA'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isBot
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.isBot ? (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="bg-input border-border"
                  />
                  <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">IA Configurada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Nome:</p>
                <p className="text-sm text-muted-foreground">{company.aiName || 'IARA'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Tom:</p>
                <p className="text-sm text-muted-foreground">
                  {company.tone === 'formal' ? 'Formal' : 
                   company.tone === 'casual' ? 'Casual' : 
                   company.tone === 'friendly' ? 'Amigável' : 'Profissional'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Produtos:</p>
                <p className="text-sm text-muted-foreground">{company.products?.length || 0} cadastrados</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Dicas de Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Pergunte sobre produtos</p>
                <p>• Peça informações de preços</p>
                <p>• Teste horários de funcionamento</p>
                <p>• Simule uma saudação</p>
                <p>• Pergunte sobre entrega</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationSimulator;
