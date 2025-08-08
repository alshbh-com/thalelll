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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language, analysisResultId, conversationHistory } = await req.json();

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
    
    // Get user's preferred explanation style if authenticated
    let explanationStyle = 'simple';
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_explanation_style')
        .eq('user_id', userId)
        .single();
      
      explanationStyle = profile?.preferred_explanation_style || 'simple';
    }

    // Get analysis context if analysisResultId is provided
    let analysisContext = '';
    if (analysisResultId && userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: analysis } = await supabase
        .from('analysis_results')
        .select('structured_data, analysis_result')
        .eq('id', analysisResultId)
        .eq('user_id', userId)
        .single();
        
      if (analysis) {
        analysisContext = isArabic 
          ? `\n\nسياق التحليل الطبي للمريض:\n${JSON.stringify(analysis.structured_data || analysis.analysis_result, null, 2)}`
          : `\n\nPatient's medical analysis context:\n${JSON.stringify(analysis.structured_data || analysis.analysis_result, null, 2)}`;
      }
    }

    // Create appropriate system prompt based on explanation style and language
    let systemPrompt = '';
    
    if (isArabic) {
      if (explanationStyle === 'medical') {
        systemPrompt = `أنت مساعد طبي ذكي متخصص في شرح التحاليل الطبية بلغة طبية دقيقة ومهنية. 
        أجب على أسئلة المرضى باستخدام المصطلحات الطبية الصحيحة مع الحفاظ على الوضوح.
        يمكنك التحدث بالعربية الفصحى أو العامية المصرية حسب طبيعة السؤال.`;
      } else if (explanationStyle === 'both') {
        systemPrompt = `أنت مساعد طبي ذكي. أجب على الأسئلة بطريقتين:
        1. تفسير طبي دقيق للأطباء والمختصين
        2. تفسير مبسط للمرضى العاديين
        يمكنك استخدام العربية الفصحى أو العامية المصرية.`;
      } else {
        systemPrompt = `أنت مساعد طبي ذكي متخصص في تبسيط المعلومات الطبية للمرضى العاديين.
        أجب بلغة بسيطة ومفهومة، تجنب المصطلحات الطبية المعقدة. 
        يمكنك التحدث بالعامية المصرية لتكون أكثر قرباً من المريض.`;
      }
    } else {
      if (explanationStyle === 'medical') {
        systemPrompt = `You are a smart medical assistant specialized in explaining medical tests using precise medical terminology.
        Answer patient questions using correct medical terms while maintaining clarity.`;
      } else if (explanationStyle === 'both') {
        systemPrompt = `You are a smart medical assistant. Answer questions in two ways:
        1. Precise medical explanation for doctors and specialists
        2. Simple explanation for regular patients`;
      } else {
        systemPrompt = `You are a smart medical assistant specialized in simplifying medical information for regular patients.
        Answer in simple, understandable language, avoiding complex medical terminology.`;
      }
    }

    systemPrompt += isArabic 
      ? `\n\nمهم جداً:\n- لا تقدم تشخيص طبي مباشر\n- أنصح دائماً بمراجعة طبيب مختص\n- أجب بإيجاز ووضوح\n- إذا لم تكن متأكداً من معلومة، اذكر ذلك`
      : `\n\nImportant:\n- Do NOT provide direct medical diagnosis\n- Always recommend consulting a healthcare professional\n- Answer concisely and clearly\n- If unsure about information, mention it`;

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = isArabic ? '\n\nسياق المحادثة السابقة:\n' : '\n\nPrevious conversation context:\n';
      conversationHistory.forEach((msg: any) => {
        conversationContext += `${msg.message_type === 'user' ? (isArabic ? 'المريض' : 'Patient') : (isArabic ? 'المساعد' : 'Assistant')}: ${msg.content}\n`;
      });
    }

    const fullPrompt = `${systemPrompt}${analysisContext}${conversationContext}

${isArabic ? 'السؤال الحالي:' : 'Current question:'} ${message}`;

    console.log('Sending request to Gemini API for chat...');

    // Call Gemini API
    const requestBody = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

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
      return new Response(JSON.stringify({ error: 'Failed to get chat response' }), {
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

    // Save chat messages to database if user is authenticated
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Save user message
      await supabase.from('chat_messages').insert({
        user_id: userId,
        analysis_result_id: analysisResultId || null,
        message_type: 'user',
        content: message,
        language
      });

      // Save assistant response
      await supabase.from('chat_messages').insert({
        user_id: userId,
        analysis_result_id: analysisResultId || null,
        message_type: 'assistant',
        content: aiResponse,
        language
      });
    }

    console.log('Chat response completed successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in medical-chat-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});