
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  id: string;
  from: string;
  type: 'text' | 'audio' | 'image' | 'document';
  text?: { body: string };
  audio?: { id: string };
  image?: { id: string };
  document?: { id: string };
  timestamp: string;
}

interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
        statuses?: any[];
      };
      field: string;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const url = new URL(req.url);
    
    // Webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      
      console.log('Webhook verification:', { mode, token });
      
      if (mode === 'subscribe' && token) {
        // Verify token against business profile
        const { data: business } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('webhook_verify_token', token)
          .single();
          
        if (business) {
          console.log('Webhook verified for business:', business.name);
          return new Response(challenge, { headers: corsHeaders });
        }
      }
      
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const webhookData: WhatsAppWebhook = await req.json();
      console.log('Received webhook:', JSON.stringify(webhookData, null, 2));

      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await processIncomingMessage(supabase, message, change.value.metadata.phone_number_id);
            }
          }
        }
      }

      return new Response('OK', { headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processIncomingMessage(supabase: any, message: WhatsAppMessage, phoneNumberId: string) {
  console.log('Processing message:', message.id);

  // Find business profile by phone number ID
  const { data: business, error: businessError } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('whatsapp_phone_id', phoneNumberId)
    .single();

  if (businessError || !business) {
    console.error('Business not found for phone number ID:', phoneNumberId);
    return;
  }

  // Find or create conversation
  let conversation;
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('business_id', business.id)
    .eq('whatsapp_contact_id', message.from)
    .single();

  if (existingConversation) {
    conversation = existingConversation;
  } else {
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert([{
        business_id: business.id,
        whatsapp_contact_id: message.from,
        contact_phone: message.from,
        status: 'active'
      }])
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return;
    }
    conversation = newConversation;
  }

  // Process message based on type
  let messageContent = '';
  let transcription = null;
  let mediaUrl = null;

  if (message.type === 'text' && message.text) {
    messageContent = message.text.body;
  } else if (message.type === 'audio' && message.audio) {
    // Download and transcribe audio
    try {
      const audioUrl = await downloadWhatsAppMedia(business.whatsapp_token, message.audio.id);
      mediaUrl = audioUrl;
      transcription = await transcribeAudio(audioUrl);
      messageContent = transcription || 'Áudio não pôde ser transcrito';
    } catch (error) {
      console.error('Error processing audio:', error);
      messageContent = 'Erro ao processar áudio';
    }
  }

  // Save incoming message
  const { data: savedMessage, error: messageError } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversation.id,
      whatsapp_message_id: message.id,
      direction: 'inbound',
      message_type: message.type,
      content: messageContent,
      audio_url: mediaUrl,
      transcription: transcription
    }])
    .select()
    .single();

  if (messageError) {
    console.error('Error saving message:', messageError);
    return;
  }

  // Generate AI response
  await generateAndSendResponse(supabase, business, conversation, messageContent);
}

async function downloadWhatsAppMedia(accessToken: string, mediaId: string): Promise<string> {
  // Get media URL from WhatsApp API
  const mediaResponse = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const mediaData = await mediaResponse.json();
  return mediaData.url;
}

async function transcribeAudio(audioUrl: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Download audio file
  const audioResponse = await fetch(audioUrl);
  const audioBuffer = await audioResponse.arrayBuffer();
  
  // Create form data for Whisper API
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');

  const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: formData
  });

  const transcriptionData = await transcriptionResponse.json();
  return transcriptionData.text;
}

async function generateAndSendResponse(supabase: any, business: any, conversation: any, userMessage: string) {
  const startTime = Date.now();

  try {
    // Get business context
    const [products, policies, promotions, aiConfig] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('policies').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('promotions').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('ai_configs').select('*').eq('business_id', business.id).single()
    ]);

    // Build dynamic prompt
    const prompt = buildAIPrompt(business, products.data, policies.data, promotions.data, userMessage);
    
    // Generate response with DeepSeek
    const aiResponse = await generateAIResponse(prompt);
    
    // Save AI response message
    const { data: responseMessage } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        direction: 'outbound',
        message_type: 'text',
        content: aiResponse,
        ai_response_generated: true,
        processing_time_ms: Date.now() - startTime
      }])
      .select()
      .single();

    // Send response via WhatsApp
    await sendWhatsAppMessage(business.whatsapp_token, conversation.contact_phone, aiResponse);
    
    // Generate and send audio if enabled
    if (aiConfig.data?.enable_audio) {
      const audioUrl = await generateTTSAudio(aiResponse, aiConfig.data.voice_id);
      if (audioUrl) {
        await sendWhatsAppAudio(business.whatsapp_token, conversation.contact_phone, audioUrl);
      }
    }

  } catch (error) {
    console.error('Error generating response:', error);
    
    // Send fallback message
    const fallbackMessage = "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.";
    await sendWhatsAppMessage(business.whatsapp_token, conversation.contact_phone, fallbackMessage);
  }
}

function buildAIPrompt(business: any, products: any[], policies: any[], promotions: any[], userMessage: string): string {
  const context = {
    company: {
      name: business.name,
      description: business.description,
      industry: business.industry,
      tone: business.tone,
      ai_name: business.ai_name,
      ai_personality: business.ai_personality
    },
    products: products.map(p => ({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category
    })),
    policies: policies.map(p => ({
      type: p.type,
      title: p.title,
      description: p.description
    })),
    promotions: promotions.filter(p => {
      const now = new Date();
      const validUntil = p.valid_until ? new Date(p.valid_until) : null;
      return !validUntil || validUntil > now;
    }).map(p => ({
      title: p.title,
      description: p.description,
      discount_percentage: p.discount_percentage,
      discount_amount: p.discount_amount
    }))
  };

  return `Você é ${context.company.ai_name}, assistente virtual da empresa ${context.company.name}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${context.company.name}
- Descrição: ${context.company.description || 'Não informado'}
- Setor: ${context.company.industry || 'Não informado'}
- Tom de voz: ${context.company.tone}
- Personalidade: ${context.company.ai_personality || 'Assistente amigável e prestativo'}

PRODUTOS DISPONÍVEIS:
${context.products.length > 0 ? context.products.map(p => 
  `- ${p.name}: ${p.description} | Preço: R$ ${p.price} | Estoque: ${p.stock} unidades`
).join('\n') : 'Nenhum produto cadastrado'}

POLÍTICAS DA EMPRESA:
${context.policies.length > 0 ? context.policies.map(p => 
  `- ${p.title} (${p.type}): ${p.description}`
).join('\n') : 'Nenhuma política cadastrada'}

PROMOÇÕES ATIVAS:
${context.promotions.length > 0 ? context.promotions.map(p => 
  `- ${p.title}: ${p.description}${p.discount_percentage ? ` (${p.discount_percentage}% de desconto)` : ''}${p.discount_amount ? ` (R$ ${p.discount_amount} de desconto)` : ''}`
).join('\n') : 'Nenhuma promoção ativa'}

INSTRUÇÕES:
- Responda como ${context.company.ai_name}, sempre mantendo o tom ${context.company.tone}
- Foque em ajudar o cliente e gerar vendas
- Use as informações acima para responder com precisão
- Se não souber algo, seja honesto mas tente direcionar para produtos/serviços disponíveis
- Mantenha respostas concisas mas informativas
- Sempre termine incentivando uma ação (compra, mais informações, etc.)

MENSAGEM DO CLIENTE: ${userMessage}

RESPOSTA:`;
}

async function generateAIResponse(prompt: string): Promise<string> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateTTSAudio(text: string, voiceId?: string): Promise<string | null> {
  const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!elevenlabsApiKey) {
    console.log('ElevenLabs API key not configured, skipping TTS');
    return null;
  }

  const defaultVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${defaultVoiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': elevenlabsApiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    })
  });

  if (!response.ok) {
    console.error('TTS error:', await response.text());
    return null;
  }

  // For now, return placeholder URL
  // In production, you'd upload to storage and return the public URL
  return 'audio_placeholder_url';
}

async function sendWhatsAppMessage(accessToken: string, to: string, text: string) {
  const response = await fetch(`https://graph.facebook.com/v17.0/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });

  const data = await response.json();
  console.log('WhatsApp message sent:', data);
  return data;
}

async function sendWhatsAppAudio(accessToken: string, to: string, audioUrl: string) {
  const response = await fetch(`https://graph.facebook.com/v17.0/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'audio',
      audio: { link: audioUrl }
    })
  });

  const data = await response.json();
  console.log('WhatsApp audio sent:', data);
  return data;
}
