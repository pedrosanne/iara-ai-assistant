
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegisterMode }) => {
  const [email, setEmail] = useState('demo@iara.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          toast.error('Nome é obrigatório');
          return;
        }
        
        console.log('LoginForm: Registering user...');
        const { error } = await register(email, password, name);
        
        if (error) {
          console.error('LoginForm: Registration failed:', error);
          toast.error(error.message || 'Erro ao criar conta');
        } else {
          toast.success('Conta criada com sucesso!');
          console.log('LoginForm: Registration successful');
        }
      } else {
        console.log('LoginForm: Logging in user...');
        const { error } = await login(email, password);
        
        if (error) {
          console.error('LoginForm: Login failed:', error);
          toast.error(error.message || 'Erro ao fazer login');
        } else {
          toast.success('Login realizado com sucesso!');
          console.log('LoginForm: Login successful');
        }
      }
    } catch (error) {
      console.error('LoginForm: Authentication error:', error);
      toast.error(isRegisterMode ? 'Erro ao criar conta' : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">IARA</h1>
          <p className="text-muted-foreground mt-2">
            Inteligência Artificial de Relacionamento Automático
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isRegisterMode ? 'Criar Conta' : 'Entrar'}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegisterMode 
                ? 'Crie sua conta para começar a usar a IARA'
                : 'Entre com suas credenciais para acessar o painel'
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegisterMode}
                    className="bg-input border-border"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
              </div>

              {!isRegisterMode && (
                <div className="text-sm text-muted-foreground">
                  <p>Demo: demo@iara.com / 123456</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegisterMode ? 'Criar Conta' : 'Entrar'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onToggleMode}
                className="w-full"
                disabled={isLoading}
              >
                {isRegisterMode 
                  ? 'Já tem uma conta? Entrar'
                  : 'Não tem conta? Criar agora'
                }
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
