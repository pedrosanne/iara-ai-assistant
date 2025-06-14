
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
        // Verify token against business profile or environment
        const expectedToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
        
        if (token === expectedToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { headers: corsHeaders });
        }
        
        // Also check against business profiles
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
    // Update last activity
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);
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
    // Download and transcribe audio using OpenAI Whisper
    try {
      const audioUrl = await downloadWhatsAppMedia(business.whatsapp_token || Deno.env.get('WHATSAPP_TOKEN'), message.audio.id);
      mediaUrl = audioUrl;
      transcription = await transcribeAudioWithWhisper(audioUrl);
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
  const mediaResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const mediaData = await mediaResponse.json();
  return mediaData.url;
}

async function transcribeAudioWithWhisper(audioUrl: string): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Download audio file
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.text;
    
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return 'Erro na transcrição do áudio';
  }
}

async function generateAndSendResponse(supabase: any, business: any, conversation: any, userMessage: string) {
  const startTime = Date.now();

  try {
    // Get business context
    const [products, policies, promotions, recentMessages] = await Promise.all([
      supabase.from('products').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('policies').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('promotions').select('*').eq('business_id', business.id).eq('active', true),
      supabase.from('messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(10)
    ]);

    // Build dynamic prompt with conversation history
    const prompt = buildAIPrompt(business, products.data || [], policies.data || [], promotions.data || [], userMessage, recentMessages.data || []);
    
    // Generate response with DeepSeek
    const aiResponse = await generateAIResponseWithDeepSeek(prompt);
    
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

    // Send text response via WhatsApp
    await sendWhatsAppMessage(business.whatsapp_token || Deno.env.get('WHATSAPP_TOKEN'), conversation.contact_phone, aiResponse);
    
    // Generate and send audio using Google Cloud TTS
    try {
      const audioBase64 = await generateGoogleTTSAudio(aiResponse);
      if (audioBase64) {
        // For now, we'll just log that audio was generated
        // In production, you'd upload this to Supabase Storage and send the URL
        console.log('Audio generated successfully with Google TTS');
      }
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
    }

  } catch (error) {
    console.error('Error generating response:', error);
    
    // Send fallback message
    const fallbackMessage = "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.";
    await sendWhatsAppMessage(business.whatsapp_token || Deno.env.get('WHATSAPP_TOKEN'), conversation.contact_phone, fallbackMessage);
  }
}

function buildAIPrompt(business: any, products: any[], policies: any[], promotions: any[], userMessage: string, recentMessages: any[]): string {
  // Build conversation history
  const conversationHistory = recentMessages
    .reverse() // Show chronological order
    .map(msg => `${msg.direction === 'inbound' ? 'Cliente' : business.ai_name}: ${msg.content}`)
    .join('\n');

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

HISTÓRICO DA CONVERSA:
${conversationHistory || 'Início da conversa'}

INSTRUÇÕES:
- Responda como ${context.company.ai_name}, sempre mantendo o tom ${context.company.tone}
- Foque em ajudar o cliente e gerar vendas
- Use as informações acima para responder com precisão
- Considere o histórico da conversa para dar continuidade natural
- Se não souber algo, seja honesto mas tente direcionar para produtos/serviços disponíveis
- Mantenha respostas concisas mas informativas (máximo 300 caracteres para WhatsApp)
- Sempre termine incentivando uma ação (compra, mais informações, etc.)

MENSAGEM ATUAL DO CLIENTE: ${userMessage}

RESPOSTA:`;
}

async function generateAIResponseWithDeepSeek(prompt: string): Promise<string> {
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
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateGoogleTTSAudio(text: string): Promise<string | null> {
  const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
  if (!googleApiKey) {
    console.log('Google Cloud API key not configured, skipping TTS');
    return null;
  }

  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: text },
        voice: {
          languageCode: 'pt-BR',
          name: 'pt-BR-Standard-A', // Brazilian Portuguese female voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google TTS error:', errorText);
      return null;
    }

    const data = await response.json();
    return data.audioContent; // Base64 encoded audio

  } catch (error) {
    console.error('Error generating Google TTS audio:', error);
    return null;
  }
}

async function sendWhatsAppMessage(accessToken: string, to: string, text: string) {
  const whatsappPhoneId = Deno.env.get('WHATSAPP_PHONE_ID');
  
  const response = await fetch(`https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`, {
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
  
  if (!response.ok) {
    console.error('WhatsApp API error:', data);
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }
  
  return data;
}
