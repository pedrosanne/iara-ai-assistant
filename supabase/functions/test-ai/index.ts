
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

    // Generate response based on real data
    const aiResponse = generateDataBasedResponse(
      business, 
      products.data || [], 
      policies.data || [], 
      promotions.data || [], 
      message
    );

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

function generateDataBasedResponse(business: any, products: any[], policies: any[], promotions: any[], userMessage: string): string {
  const messageLower = userMessage.toLowerCase();
  
  // Check if user is asking about products
  if (messageLower.includes('produto') || messageLower.includes('catálogo') || messageLower.includes('vender')) {
    if (products.length === 0) {
      return `Olá! Sou a ${business.ai_name} da ${business.name}. No momento não temos produtos cadastrados em nosso sistema. Entre em contato conosco para mais informações sobre nossos serviços.`;
    }
    
    let response = `Olá! Sou a ${business.ai_name} da ${business.name}. Temos ${products.length} produto(s) disponível(is):\n\n`;
    products.forEach((product, index) => {
      response += `${index + 1}. ${product.name}`;
      if (product.description) response += ` - ${product.description}`;
      if (product.price) response += ` | Preço: R$ ${product.price}`;
      if (product.stock !== null) response += ` | Estoque: ${product.stock} unidades`;
      response += '\n';
    });
    return response;
  }
  
  // Check if user is asking about prices
  if (messageLower.includes('preço') || messageLower.includes('valor') || messageLower.includes('cust')) {
    const productsWithPrice = products.filter(p => p.price);
    if (productsWithPrice.length === 0) {
      return `Olá! Sou a ${business.ai_name} da ${business.name}. Para informações sobre preços, entre em contato conosco diretamente.`;
    }
    
    let response = `Olá! Sou a ${business.ai_name} da ${business.name}. Aqui estão nossos preços:\n\n`;
    productsWithPrice.forEach((product, index) => {
      response += `${index + 1}. ${product.name}: R$ ${product.price}\n`;
    });
    return response;
  }
  
  // Check if user is asking about promotions
  if (messageLower.includes('promoção') || messageLower.includes('desconto') || messageLower.includes('oferta')) {
    if (promotions.length === 0) {
      return `Olá! Sou a ${business.ai_name} da ${business.name}. No momento não temos promoções ativas. Fique atento às nossas redes sociais para novidades!`;
    }
    
    let response = `Olá! Sou a ${business.ai_name} da ${business.name}. Temos ${promotions.length} promoção(ões) ativa(s):\n\n`;
    promotions.forEach((promo, index) => {
      response += `${index + 1}. ${promo.title}: ${promo.description}`;
      if (promo.discount_percentage) response += ` (${promo.discount_percentage}% de desconto)`;
      if (promo.discount_amount) response += ` (R$ ${promo.discount_amount} de desconto)`;
      response += '\n';
    });
    return response;
  }
  
  // Check if user is asking about policies
  if (messageLower.includes('política') || messageLower.includes('entrega') || messageLower.includes('troca') || messageLower.includes('pagamento')) {
    if (policies.length === 0) {
      return `Olá! Sou a ${business.ai_name} da ${business.name}. Para informações sobre nossas políticas, entre em contato conosco diretamente.`;
    }
    
    let response = `Olá! Sou a ${business.ai_name} da ${business.name}. Aqui estão nossas políticas:\n\n`;
    policies.forEach((policy, index) => {
      response += `${index + 1}. ${policy.title}: ${policy.description}\n`;
    });
    return response;
  }
  
  // Default greeting with business info
  let response = `Olá! Sou a ${business.ai_name}, assistente virtual da ${business.name}.`;
  
  if (business.description) {
    response += ` ${business.description}`;
  }
  
  response += ' Como posso ajudar você hoje?';
  
  if (products.length > 0) {
    response += ` Temos ${products.length} produto(s) disponível(is).`;
  }
  
  if (promotions.length > 0) {
    response += ` Também temos ${promotions.length} promoção(ões) ativa(s).`;
  }
  
  return response;
}
