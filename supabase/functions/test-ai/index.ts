
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { business_id, message } = await req.json();

    if (!business_id || !message) {
      return new Response(
        JSON.stringify({ error: 'business_id e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get business profile
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: 'Perfil da empresa não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get business context
    const [products, policies, promotions] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business_id).eq('active', true),
      supabase.from('policies').select('*').eq('business_id', business_id).eq('active', true),
      supabase.from('promotions').select('*').eq('business_id', business_id).eq('active', true)
    ]);

    // Build prompt
    const prompt = buildTestPrompt(business, products.data || [], policies.data || [], promotions.data || [], message);

    // Generate response with mock AI (replace with DeepSeek when API key is available)
    const aiResponse = await generateMockResponse(prompt);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context_used: {
          business: business.name,
          products_count: products.data?.length || 0,
          policies_count: policies.data?.length || 0,
          promotions_count: promotions.data?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Test AI error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildTestPrompt(business: any, products: any[], policies: any[], promotions: any[], userMessage: string): string {
  return `Você é ${business.ai_name}, assistente virtual da empresa ${business.name}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${business.name}
- Descrição: ${business.description || 'Não informado'}
- Setor: ${business.industry || 'Não informado'}
- Tom de voz: ${business.tone}

PRODUTOS DISPONÍVEIS (${products.length}):
${products.length > 0 ? products.map(p => 
  `- ${p.name}: ${p.description || 'Sem descrição'} | Preço: R$ ${p.price || 'Não informado'} | Estoque: ${p.stock} unidades`
).join('\n') : 'Nenhum produto cadastrado'}

POLÍTICAS DA EMPRESA (${policies.length}):
${policies.length > 0 ? policies.map(p => 
  `- ${p.title} (${p.type}): ${p.description}`
).join('\n') : 'Nenhuma política cadastrada'}

PROMOÇÕES ATIVAS (${promotions.length}):
${promotions.length > 0 ? promotions.map(p => 
  `- ${p.title}: ${p.description}${p.discount_percentage ? ` (${p.discount_percentage}% de desconto)` : ''}${p.discount_amount ? ` (R$ ${p.discount_amount} de desconto)` : ''}`
).join('\n') : 'Nenhuma promoção ativa'}

MENSAGEM DO CLIENTE: ${userMessage}

Responda como ${business.ai_name}, mantendo o tom ${business.tone} e focando em ajudar o cliente.`;
}

async function generateMockResponse(prompt: string): Promise<string> {
  // Mock response for testing - replace with DeepSeek API when available
  const responses = [
    "Olá! Sou a IARA e estou aqui para ajudar você! Como posso te auxiliar hoje?",
    "Ótima pergunta! Com base nos nossos produtos e serviços, posso te ajudar a encontrar exatamente o que você precisa.",
    "Claro! Vou te apresentar as melhores opções do nosso catálogo. Que tipo de produto você está procurando?",
    "Perfeito! Temos algumas promoções especiais que podem te interessar. Gostaria de saber mais?",
    "Entendi sua necessidade! Com certeza posso te ajudar a encontrar a solução ideal. Vamos conversar sobre as opções?"
  ];

  // Simple mock logic based on prompt content
  if (prompt.includes('produtos') || prompt.includes('produto')) {
    return "Temos vários produtos interessantes em nosso catálogo! Posso te apresentar nossas opções e ajudar você a escolher o mais adequado. Que tipo de produto você está procurando?";
  }
  
  if (prompt.includes('preço') || prompt.includes('valor')) {
    return "Nossos preços são super competitivos! Além disso, temos algumas promoções especiais que podem te interessar. Quer que eu te conte mais sobre nossos produtos e valores?";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}
