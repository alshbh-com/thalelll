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
    const { reportText, inputType, userAge, userGender, language } = await req.json();

    if (!reportText) {
      return new Response(JSON.stringify({ error: 'Report text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is authenticated (optional for public use)
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

    // Create enhanced prompt for structured analysis based on language
    const isArabic = language === 'ar';
    const systemPrompt = isArabic 
      ? `أنت طبيب مختص في تفسير التحاليل الطبية. قم بتحليل التحاليل التالية وأرجع النتيجة بصيغة JSON منظمة باللغة العربية.

معلومات المريض: العمر ${userAge || 'غير محدد'}, الجنس: ${userGender === 'male' ? 'ذكر' : userGender === 'female' ? 'أنثى' : 'غير محدد'}

يجب أن يكون الرد بصيغة JSON تحتوي على:
{
  "summary": "ملخص عام للحالة الصحية",
  "riskScore": رقم من 0 إلى 100 (0 = خطر عالي، 100 = آمن تماماً),
  "riskLevel": "low" أو "medium" أو "high",
  "testResults": [
    {
      "name": "اسم التحليل",
      "value": "القيمة",
      "unit": "الوحدة",
      "normalRange": "المعدل الطبيعي",
      "status": "normal" أو "high" أو "low",
      "medicalExplanation": "تفسير طبي دقيق",
      "simpleExplanation": "تفسير مبسط للمريض العادي"
    }
  ],
  "abnormalValues": [
    {
      "testName": "اسم التحليل",
      "currentValue": "القيمة الحالية",
      "normalRange": "المعدل الطبيعي",
      "severity": "mild" أو "moderate" أو "severe",
      "explanation": "سبب الارتفاع أو الانخفاض"
    }
  ],
  "suggestions": [
    "نصيحة 1",
    "نصيحة 2"
  ],
  "recommendedTests": [
    "تحليل إضافي مقترح 1",
    "تحليل إضافي مقترح 2"
  ],
  "specialistConsultation": "نوع الطبيب المختص المطلوب إن وجد أو null"
}

مهم جداً: 
- أرجع JSON صالح فقط بدون أي نص إضافي
- لا تقدم تشخيص طبي مباشر
- استخدم لغة عربية بسيطة ومفهومة`
      : `You are a medical expert specializing in interpreting lab results. Analyze the following medical tests and return a structured JSON response in English.

Patient information: Age ${userAge || 'not specified'}, Gender: ${userGender || 'not specified'}

Return a JSON response with this structure:
{
  "summary": "General health status summary",
  "riskScore": number from 0 to 100 (0 = high risk, 100 = completely safe),
  "riskLevel": "low" or "medium" or "high",
  "testResults": [
    {
      "name": "Test name",
      "value": "Result value",
      "unit": "Unit of measurement",
      "normalRange": "Normal range",
      "status": "normal" or "high" or "low",
      "medicalExplanation": "Precise medical explanation",
      "simpleExplanation": "Simple explanation for regular patients"
    }
  ],
  "abnormalValues": [
    {
      "testName": "Test name",
      "currentValue": "Current value",
      "normalRange": "Normal range",
      "severity": "mild" or "moderate" or "severe",
      "explanation": "Reason for elevation or decrease"
    }
  ],
  "suggestions": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "recommendedTests": [
    "Suggested additional test 1",
    "Suggested additional test 2"
  ],
  "specialistConsultation": "Type of specialist required if any, or null"
}

Important:
- Return valid JSON only without additional text
- Do NOT provide direct medical diagnosis
- Use simple, understandable language`;

    // Check if report text contains image data
    const isImageData = reportText.startsWith('[IMAGE_DATA]:');
    let prompt;
    let requestBody;

    if (isImageData) {
      // Extract base64 image data
      const base64Image = reportText.replace('[IMAGE_DATA]:', '');
      
      prompt = systemPrompt + '\n\n' + (isArabic ? 'الرجاء تحليل صورة التحاليل الطبية المرفقة:' : 'Please analyze the medical lab results image attached:');
      
      requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      };
    } else {
      prompt = `${systemPrompt}

${isArabic ? 'نتائج التحاليل:' : 'Lab Results:'}
${reportText}`;

      requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      };
    }

    console.log('Sending request to Gemini API...');

    // Call Gemini API
    const modelName = 'gemini-1.5-flash-latest';
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      return new Response(JSON.stringify({ error: 'No analysis result from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to parse the JSON response
    let analysisResult;
    try {
      // Clean up the response text in case it has markdown formatting
      const cleanText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', parseError);
      // Fallback to plain text analysis
      analysisResult = {
        summary: analysisText,
        riskScore: 75,
        riskLevel: "medium",
        testResults: [],
        abnormalValues: [],
        suggestions: [isArabic ? "يُنصح بمراجعة طبيب مختص" : "Please consult a healthcare professional"],
        recommendedTests: [],
        specialistConsultation: null
      };
    }

    // Save analysis result to database only if user is authenticated
    let savedResult = null;
    if (userId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error: saveError } = await supabase
        .from('analysis_results')
        .insert({
          user_id: userId,
          input_type: inputType || 'manual',
          original_text: reportText,
          analysis_result: { text: analysisText },
          structured_data: analysisResult,
          risk_score: analysisResult.riskScore || null,
          risk_level: analysisResult.riskLevel || null,
          suggestions: analysisResult.suggestions || [],
          abnormal_values: analysisResult.abnormalValues || [],
          user_age: userAge,
          user_gender: userGender,
          language: language || 'ar'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving analysis result:', saveError);
        // Continue without saving if there's an error
      } else {
        savedResult = data;
      }
    }

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({ 
      analysis: analysisResult,
      resultId: savedResult?.id,
      isStructured: true
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