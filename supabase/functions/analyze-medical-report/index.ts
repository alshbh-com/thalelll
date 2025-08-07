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
    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportText, inputType, userAge, userGender, language } = await req.json();

    if (!reportText) {
      return new Response(JSON.stringify({ error: 'Report text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create prompt for Gemini based on language
    const isArabic = language === 'ar';
    const systemPrompt = isArabic 
      ? `أنت طبيب مختص في تفسير التحاليل الطبية. قم بتحليل التحاليل التالية وقدم تفسيرًا مبسطًا وواضحًا باللغة العربية. 

معلومات المريض: العمر ${userAge || 'غير محدد'}, الجنس: ${userGender === 'male' ? 'ذكر' : userGender === 'female' ? 'أنثى' : 'غير محدد'}

يجب أن يتضمن التحليل:
1. شرح مبسط لكل تحليل
2. هل القيم ضمن المعدل الطبيعي أم لا
3. الأسباب المحتملة للارتفاع أو الانخفاض
4. نصائح عامة

مهم جداً: 
- لا تقدم أي تشخيص طبي
- أضف في النهاية: "هذه المعلومات تعليمية فقط. يُنصح بمراجعة الطبيب المختص لتفسير دقيق وخطة علاجية."
- استخدم لغة بسيطة ومفهومة`
      : `You are a medical expert specializing in interpreting lab results. Analyze the following medical tests and provide a clear, simplified explanation in English.

Patient information: Age ${userAge || 'not specified'}, Gender: ${userGender || 'not specified'}

Your analysis should include:
1. Simple explanation of each test
2. Whether values are within normal range
3. Possible causes for high or low values
4. General recommendations

Important:
- Do NOT provide medical diagnosis
- End with: "This information is educational only. Please consult with a healthcare professional for accurate interpretation and treatment plan."
- Use simple, understandable language`;

    const prompt = `${systemPrompt}

${isArabic ? 'نتائج التحاليل:' : 'Lab Results:'}
${reportText}`;

    console.log('Sending request to Gemini API...');

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to analyze report' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const analysisResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisResult) {
      return new Response(JSON.stringify({ error: 'No analysis result from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save analysis result to database
    const { data: savedResult, error: saveError } = await supabase
      .from('analysis_results')
      .insert({
        user_id: user.id,
        input_type: inputType || 'manual',
        original_text: reportText,
        analysis_result: {
          text: analysisResult,
          timestamp: new Date().toISOString(),
          model: 'gemini-1.5-flash-latest'
        },
        user_age: userAge,
        user_gender: userGender,
        language: language || 'ar'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis result:', saveError);
      // Still return the analysis even if saving fails
    }

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({ 
      analysis: analysisResult,
      resultId: savedResult?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-medical-report function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});