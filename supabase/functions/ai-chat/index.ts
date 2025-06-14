
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
    const { business_id, message, conversation_id } = await req.json();

    if (!business_id || !message) {
      return new Response(
        JSON.stringify({ error: 'business_id e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get business profile with AI config
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

    // Get AI configuration
    const { data: aiConfig } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('business_id', business_id)
      .single();

    // Get business context data
    const [products, policies, promotions] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business_id).eq('active', true),
      supabase.from('policies').select('*').eq('business_id', business_id).eq('active', true),
      supabase.from('promotions').select('*').eq('business_id', business_id).eq('active', true)
    ]);

    // Get conversation history if conversation_id is provided
    let conversationHistory = [];
    if (conversation_id) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      conversationHistory = messages?.reverse() || [];
    }

    // Build dynamic AI prompt
    const systemPrompt = buildSystemPrompt(
      business, 
      products.data || [], 
      policies.data || [], 
      promotions.data || [],
      aiConfig
    );

    // Build conversation context
    const conversationMessages = buildConversationMessages(systemPrompt, conversationHistory, message);

    // Generate AI response using DeepSeek
    const aiResponse = await generateDeepSeekResponse(conversationMessages);

    // Save conversation and messages if conversation_id is provided
    if (conversation_id) {
      // Save user message
      await supabase.from('messages').insert([{
        conversation_id,
        direction: 'inbound',
        message_type: 'text',
        content: message
      }]);

      // Save AI response
      await supabase.from('messages').insert([{
        conversation_id,
        direction: 'outbound',
        message_type: 'text',
        content: aiResponse,
        ai_response_generated: true
      }]);
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context_used: {
          business: business.name,
          products_count: products.data?.length || 0,
          policies_count: policies.data?.length || 0,
          promotions_count: promotions.data?.length || 0,
          conversation_history_count: conversationHistory.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(business: any, products: any[], policies: any[], promotions: any[], aiConfig: any): string {
  const activePromotions = promotions.filter(p => {
    const now = new Date();
    const validUntil = p.valid_until ? new Date(p.valid_until) : null;
    return !validUntil || validUntil > now;
  });

  let prompt = `Você é ${business.ai_name}, assistente virtual da empresa ${business.name}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${business.name}
- Descrição: ${business.description || 'Não informado'}
- Setor: ${business.industry || 'Não informado'}
- Tom de voz: ${business.tone}
- Personalidade: ${business.ai_personality || 'Assistente amigável e prestativo'}

PRODUTOS E SERVIÇOS DISPONÍVEIS (${products.length} itens):`;

  if (products.length > 0) {
    products.forEach((product, index) => {
      prompt += `\n${index + 1}. ${product.name}`;
      if (product.description) prompt += ` - ${product.description}`;
      if (product.price) prompt += ` | Preço: R$ ${product.price}`;
      if (product.stock !== null && product.stock !== undefined) prompt += ` | Estoque: ${product.stock} unidades`;
      if (product.category) prompt += ` | Categoria: ${product.category}`;
    });
  } else {
    prompt += '\nNenhum produto cadastrado no momento.';
  }

  prompt += `\n\nPOLÍTICAS DA EMPRESA (${policies.length} políticas):`;
  if (policies.length > 0) {
    policies.forEach((policy, index) => {
      prompt += `\n${index + 1}. ${policy.title} (${policy.type}): ${policy.description}`;
    });
  } else {
    prompt += '\nNenhuma política específica cadastrada.';
  }

  prompt += `\n\nPROMOÇÕES ATIVAS (${activePromotions.length} promoções):`;
  if (activePromotions.length > 0) {
    activePromotions.forEach((promo, index) => {
      prompt += `\n${index + 1}. ${promo.title}: ${promo.description}`;
      if (promo.discount_percentage) prompt += ` (${promo.discount_percentage}% de desconto)`;
      if (promo.discount_amount) prompt += ` (R$ ${promo.discount_amount} de desconto)`;
      if (promo.valid_until) prompt += ` | Válida até: ${new Date(promo.valid_until).toLocaleDateString('pt-BR')}`;
    });
  } else {
    prompt += '\nNenhuma promoção ativa no momento.';
  }

  // Add response style configuration
  const responseStyle = aiConfig?.response_style || 'balanced';
  let styleInstruction = '';
  switch (responseStyle) {
    case 'concise':
      styleInstruction = 'Seja conciso e direto nas respostas, use poucas palavras.';
      break;
    case 'detailed':
      styleInstruction = 'Forneça respostas detalhadas e completas, explicando bem cada ponto.';
      break;
    default:
      styleInstruction = 'Mantenha um equilíbrio entre clareza e completude nas respostas.';
  }

  prompt += `\n\nINSTRUÇÕES COMPORTAMENTAIS:
- ${styleInstruction}
- Responda sempre mantendo o tom ${business.tone}
- Foque em ajudar o cliente e gerar vendas/leads
- Use as informações reais acima para responder com precisão
- Se não souber algo específico, seja honesto mas direcione para produtos/serviços disponíveis
- Sempre termine incentivando uma ação (compra, mais informações, contato, etc.)
- Se perguntarem sobre preços, consulte a lista de produtos acima
- Para políticas específicas, consulte as políticas cadastradas acima
- Destaque promoções ativas quando relevante

IMPORTANTE: Use APENAS as informações reais fornecidas acima sobre a empresa, produtos, políticas e promoções. Não invente informações.`;

  return prompt;
}

function buildConversationMessages(systemPrompt: string, conversationHistory: any[], currentMessage: string): any[] {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history
  conversationHistory.forEach(msg => {
    if (msg.direction === 'inbound') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.direction === 'outbound' && msg.ai_response_generated) {
      messages.push({ role: 'assistant', content: msg.content });
    }
  });

  // Add current message
  messages.push({ role: 'user', content: currentMessage });

  return messages;
}

async function generateDeepSeekResponse(messages: any[]): Promise<string> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY não configurada');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('DeepSeek API Error:', errorData);
    throw new Error(`Erro na API DeepSeek: ${errorData.error?.message || 'Erro desconhecido'}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Resposta inválida da API DeepSeek');
  }

  return data.choices[0].message.content.trim();
}
