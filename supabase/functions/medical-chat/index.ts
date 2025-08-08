import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language, conversationHistory } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: authHeader },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    const isArabic = language === 'ar';
    const systemPrompt = isArabic 
      ? `أنت طبيب مختص وخبير في تفسير التحاليل الطبية والإجابة على الأسئلة الطبية. 

قواعد مهمة:
- استخدم لغة بسيطة ومفهومة
- لا تقدم تشخيص طبي قاطع
- انصح دائماً بمراجعة الطبيب المختص للحالات الجدية
- اشرح المصطلحات الطبية بطريقة مبسطة
- إذا سُئلت عن أعراض خطيرة، انصح بالذهاب للطبيب فوراً

أسلوب الرد:
- ابدأ بإجابة مباشرة على السؤال
- اشرح السبب أو المعلومات الطبية
- اختتم بنصيحة أو توجيه مناسب`
      : `You are a medical expert specializing in interpreting lab results and answering medical questions.

Important rules:
- Use simple, understandable language
- Do not provide definitive medical diagnosis
- Always recommend consulting with a healthcare professional for serious conditions
- Explain medical terms in a simplified way
- If asked about serious symptoms, advise immediate medical attention

Response style:
- Start with a direct answer to the question
- Explain the medical reasoning or information
- End with appropriate advice or guidance`;

    // Build conversation history for context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nسياق المحادثة السابق:\n';
      conversationHistory.forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'المستخدم' : 'الطبيب'}: ${msg.content}\n`;
      });
    }

    const prompt = `${systemPrompt}${conversationContext}

${isArabic ? 'سؤال المستخدم' : 'User question'}: ${message}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    console.log('Sending medical chat request to Gemini API...');

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to get response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save chat message to database if user is authenticated
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Save user message
      await supabase.from('chat_messages').insert({
        user_id: userId,
        message: message,
        role: 'user',
        language: language || 'ar'
      });

      // Save AI response
      await supabase.from('chat_messages').insert({
        user_id: userId,
        message: aiResponse,
        role: 'assistant',
        language: language || 'ar'
      });
    }

    console.log('Medical chat completed successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});