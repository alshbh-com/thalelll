import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Stethoscope, Brain, FileText, Shield } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

import LanguageSelector from '@/components/LanguageSelector';
import UserInfoForm from '@/components/UserInfoForm';
import FileUploader from '@/components/FileUploader';
import ManualInput from '@/components/ManualInput';
import AnalysisResult from '@/components/AnalysisResult';
import medicalHeroImage from '@/assets/medical-hero.jpg';

const Index = () => {
  const { toast } = useToast();

  // State management
  const [language, setLanguage] = useState('ar');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const isArabic = language === 'ar';

  // File upload handler
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setManualInput(''); // Clear manual input when file is selected
    toast({
      title: isArabic ? "تم رفع الملف" : "File Uploaded",
      description: isArabic ? `تم رفع ${file.name} بنجاح` : `${file.name} uploaded successfully`,
    });
  };

  // Convert image to base64 for analysis
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Analysis handler
  const handleAnalyze = async () => {
    if (!uploadedFile && !manualInput.trim()) {
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "يرجى رفع ملف أو إدخال النتائج يدوياً" : "Please upload a file or enter results manually",
        variant: "destructive",
      });
      return;
    }

    if (!gender || !age) {
      toast({
        title: isArabic ? "خطأ" : "Error", 
        description: isArabic ? "يرجى إدخال الجنس والعمر" : "Please enter gender and age",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let reportText = '';
      
      if (uploadedFile) {
        // If it's an image file, convert to base64
        if (uploadedFile.type.startsWith('image/')) {
          const base64 = await convertFileToBase64(uploadedFile);
          reportText = `[IMAGE_DATA]:${base64}`;
        } else {
          // For PDF files, just send the file name for now
          reportText = `File: ${uploadedFile.name}`;
        }
      } else {
        reportText = manualInput;
      }
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // For now, show a demo mode message
        console.log('No authenticated user - using demo mode');
      }

      // Call the edge function to analyze the medical report
      const { data, error } = await supabase.functions.invoke('analyze-medical-report', {
        body: {
          reportText: reportText.trim(),
          inputType: uploadedFile ? 'file' : 'manual',
          userAge: age ? parseInt(age) : null,
          userGender: gender,
          language
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        
        // Fallback to mock analysis for demo purposes
        const mockResult = isArabic ? 
          `تحليل نتائج الفحوصات الطبية

🔍 التحاليل المرفوعة:
${uploadedFile ? `الملف: ${uploadedFile.name}` : 'نتائج مدخلة يدوياً'}

📊 التفسير المبسط:

1. تحليل الهيموجلوبين (Hemoglobin = 13.5 g/dL):
   ✅ ضمن المعدل الطبيعي (12-16 g/dL للإناث، 14-18 g/dL للذكور)
   📝 الهيموجلوبين هو البروتين المسؤول عن نقل الأكسجين في الدم
   
2. تحليل كريات الدم البيضاء (WBC = 6.2 ×10⁹/L):
   ✅ ضمن المعدل الطبيعي (4-11 ×10⁹/L)
   📝 كريات الدم البيضاء تحارب العدوى وتدافع عن الجسم

3. تحليل الجلوكوز الصائم (Glucose = 95 mg/dL):
   ✅ ضمن المعدل الطبيعي (70-100 mg/dL)
   📝 مستوى السكر في الدم أثناء الصيام طبيعي

🎯 الخلاصة العامة:
جميع النتائج ضمن المعدلات الطبيعية وتشير إلى حالة صحية جيدة.

⚠️ تنبيه مهم:
هذا التفسير تعليمي فقط ولا يغني عن استشارة الطبيب المختص.` :
          `Medical Lab Results Analysis

🔍 Uploaded Analysis:
${uploadedFile ? `File: ${uploadedFile.name}` : 'Manually entered results'}

📊 Simplified Interpretation:

1. Hemoglobin Analysis (13.5 g/dL):
   ✅ Within normal range (12-16 g/dL for females, 14-18 g/dL for males)
   📝 Hemoglobin is responsible for carrying oxygen in the blood
   
2. White Blood Cell Count (WBC = 6.2 ×10⁹/L):
   ✅ Within normal range (4-11 ×10⁹/L)
   📝 White blood cells fight infection and defend the body

3. Fasting Glucose (95 mg/dL):
   ✅ Within normal range (70-100 mg/dL)
   📝 Blood sugar level during fasting is normal

🎯 Overall Summary:
All results are within normal ranges and indicate good health status.

⚠️ Important Notice:
This interpretation is for educational purposes only and does not replace medical consultation.`;

        setAnalysisResult(mockResult);
        
        toast({
          title: isArabic ? "وضع تجريبي" : "Demo Mode",
          description: isArabic ? "عرض نتيجة تجريبية - تحتاج API key" : "Showing demo result - API key needed",
          variant: "destructive",
        });
      } else {
        setAnalysisResult(data.analysis);
        
        toast({
          title: isArabic ? "تم التحليل بنجاح" : "Analysis Complete",
          description: isArabic ? "تم تحليل التقرير بواسطة الذكاء الاصطناعي" : "Report analyzed using AI successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "حدث خطأ أثناء التحليل" : "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (analysisResult && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        toast({
          title: isArabic ? "📋 نتائج التحليل جاهزة" : "📋 Analysis Results Ready",
          description: isArabic ? "تم عرض نتائج التحليل في الأسفل" : "Analysis results displayed below",
        });
      }, 500);
    }
  }, [analysisResult, isArabic, toast]);

  // PDF download handler
  const handleDownloadPDF = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set font
    pdf.setFont('helvetica');
    pdf.setFontSize(16);
    
    // Title
    const title = isArabic ? 'تقرير تحليل النتائج الطبية' : 'Medical Lab Results Report';
    pdf.text(title, 20, 30);
    
    // Date
    pdf.setFontSize(12);
    const date = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US');
    const dateText = isArabic ? `التاريخ: ${date}` : `Date: ${date}`;
    pdf.text(dateText, 20, 45);
    
    // Content
    pdf.setFontSize(10);
    const lines = analysisResult.split('\n');
    let yPosition = 60;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;
    const maxWidth = 170;
    
    lines.forEach((line) => {
      if (yPosition > pageHeight - marginBottom) {
        pdf.addPage();
        yPosition = 20;
      }
      
      if (line.trim()) {
        // Split long lines to fit page width
        const splitLines = pdf.splitTextToSize(line, maxWidth);
        
        if (Array.isArray(splitLines)) {
          splitLines.forEach((splitLine: string) => {
            if (yPosition > pageHeight - marginBottom) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(splitLine, 20, yPosition);
            yPosition += 5;
          });
        } else {
          pdf.text(splitLines, 20, yPosition);
          yPosition += 5;
        }
      } else {
        yPosition += 2;
      }
    });
    
    // Footer
    const footerText = isArabic 
      ? 'هذه المعلومات تعليمية فقط - يُنصح بمراجعة الطبيب المختص'
      : 'This information is educational only - Please consult a healthcare professional';
    pdf.setFontSize(8);
    pdf.text(footerText, 20, pageHeight - 10);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = isArabic ? `تقرير-التحاليل-${timestamp}.pdf` : `lab-report-${timestamp}.pdf`;
    pdf.save(filename);
    
    toast({
      title: isArabic ? "تم التحميل" : "Downloaded",
      description: isArabic ? "تم حفظ التقرير بصيغة PDF" : "Report saved as PDF",
    });
  };

  return (
    <div className="min-h-screen hero-gradient" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-medical/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="medical-gradient p-3 rounded-full">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                  {isArabic ? 'مُفسّر التحاليل' : 'AI Lab Explainer'}
                </h1>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-semibold text-foreground/90">
                {isArabic 
                  ? 'حمّل تحليلك الطبي واحصل على تفسير ذكي وموثوق في ثوانٍ'
                  : 'Upload your medical tests and get smart, reliable interpretation in seconds'
                }
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                {isArabic 
                  ? 'باستخدام الذكاء الاصطناعي، نشرح لك نتائج تحاليلك بلغة بشرية مفهومة دون تعقيد.'
                  : 'Using artificial intelligence, we explain your test results in understandable human language without complexity.'
                }
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-primary">
                  <Brain className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isArabic ? 'ذكاء اصطناعي متقدم' : 'Advanced AI'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-medical">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isArabic ? 'تفسير مبسط' : 'Simple Explanation'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isArabic ? 'آمن وموثوق' : 'Safe & Reliable'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="lg:text-center">
              <img 
                src={medicalHeroImage} 
                alt="Medical AI Analysis" 
                className="w-full max-w-lg mx-auto rounded-2xl soft-shadow"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-8">
          {/* Language Selector */}
          <Card className="soft-shadow">
            <CardContent className="pt-6">
              <LanguageSelector value={language} onChange={setLanguage} />
            </CardContent>
          </Card>

          {/* User Info Form */}
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                {isArabic ? 'معلومات المستخدم' : 'User Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserInfoForm
                gender={gender}
                age={age}
                language={language}
                onGenderChange={setGender}
                onAgeChange={setAge}
              />
            </CardContent>
          </Card>

          {/* File Upload or Manual Input */}
          <Card className="soft-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                {isArabic ? 'إدخال نتائج التحاليل' : 'Enter Lab Results'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div>
                <h3 className="font-medium mb-4 text-foreground">
                  {isArabic ? 'الطريقة الأولى: رفع ملف' : 'Method 1: Upload File'}
                </h3>
                <FileUploader onFileSelect={handleFileSelect} language={language} />
                {uploadedFile && (
                  <div className="mt-3 p-3 bg-primary-soft rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      {isArabic ? 'الملف المحدد:' : 'Selected file:'} {uploadedFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {isArabic ? 'أو' : 'OR'}
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Manual Input */}
              <div>
                <h3 className="font-medium mb-4 text-foreground">
                  {isArabic ? 'الطريقة الثانية: إدخال يدوي' : 'Method 2: Manual Entry'}
                </h3>
                <ManualInput
                  value={manualInput}
                  onChange={setManualInput}
                  language={language}
                />
              </div>
            </CardContent>
          </Card>

          {/* Analyze Button */}
          <div className="text-center">
            <Button
              onClick={handleAnalyze}
              variant="hero"
              disabled={isAnalyzing}
              className="min-w-[300px]"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {isArabic ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <span>🔍</span>
                  {isArabic ? 'حلّل التحاليل الآن' : 'Analyze Lab Results Now'}
                </>
              )}
            </Button>
          </div>

          {/* Analysis Result */}
          {analysisResult && (
            <div ref={resultsRef}>
              <AnalysisResult
                result={analysisResult}
                language={language}
                onDownloadPDF={handleDownloadPDF}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;