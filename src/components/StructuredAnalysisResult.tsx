import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, AlertTriangle, Activity, TrendingUp, MessageCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  medicalExplanation: string;
  simpleExplanation: string;
}

interface AbnormalValue {
  testName: string;
  currentValue: string;
  normalRange: string;
  severity: 'mild' | 'moderate' | 'severe';
  explanation: string;
}

interface StructuredAnalysis {
  summary: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  testResults: TestResult[];
  abnormalValues: AbnormalValue[];
  suggestions: string[];
  recommendedTests: string[];
  specialistConsultation: string | null;
}

interface StructuredAnalysisResultProps {
  analysis: StructuredAnalysis;
  language: string;
  resultId?: string;
  onDownloadPDF: () => void;
  onOpenChat: () => void;
}

const StructuredAnalysisResult: React.FC<StructuredAnalysisResultProps> = ({ 
  analysis, 
  language, 
  resultId,
  onDownloadPDF,
  onOpenChat
}) => {
  const { toast } = useToast();
  const isArabic = language === 'ar';
  const [activeTab, setActiveTab] = useState('summary');

  const handleCopy = async () => {
    try {
      const text = JSON.stringify(analysis, null, 2);
      await navigator.clipboard.writeText(text);
      toast({
        title: isArabic ? "تم النسخ" : "Copied",
        description: isArabic ? "تم نسخ التحليل بنجاح" : "Analysis copied successfully",
      });
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error", 
        description: isArabic ? "فشل في نسخ التحليل" : "Failed to copy analysis",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full soft-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-6 h-6 text-primary" />
            {isArabic ? 'تحليل النتائج المفصل' : 'Detailed Results Analysis'}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onOpenChat}>
              <MessageCircle className="w-4 h-4" />
              {isArabic ? 'اسأل المساعد' : 'Ask Assistant'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">{isArabic ? 'الملخص' : 'Summary'}</TabsTrigger>
            <TabsTrigger value="tests">{isArabic ? 'التحاليل' : 'Tests'}</TabsTrigger>
            <TabsTrigger value="abnormal">{isArabic ? 'القيم الشاذة' : 'Abnormal'}</TabsTrigger>
            <TabsTrigger value="recommendations">{isArabic ? 'التوصيات' : 'Recommendations'}</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {/* Risk Score Indicator */}
            <Card className={`p-4 border ${getRiskColor(analysis.riskLevel)}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">
                  {isArabic ? 'مؤشر الحالة الصحية' : 'Health Status Indicator'}
                </h3>
                <Badge variant="secondary" className={getSeverityColor(analysis.riskLevel)}>
                  {isArabic 
                    ? (analysis.riskLevel === 'low' ? 'منخفض الخطر' : analysis.riskLevel === 'medium' ? 'خطر متوسط' : 'خطر عالي')
                    : analysis.riskLevel.toUpperCase()
                  }
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{isArabic ? 'النسبة الآمنة' : 'Safety Score'}</span>
                  <span className="font-medium">{analysis.riskScore}%</span>
                </div>
                <Progress value={analysis.riskScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {isArabic 
                    ? `تحليلك في النطاق ${analysis.riskLevel === 'low' ? 'الآمن' : analysis.riskLevel === 'medium' ? 'المتوسط' : 'عالي الخطر'} بنسبة ${analysis.riskScore}%`
                    : `Your analysis is in the ${analysis.riskLevel} risk range at ${analysis.riskScore}%`
                  }
                </p>
              </div>
            </Card>

            {/* General Summary */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {isArabic ? 'الملخص العام' : 'General Summary'}
              </h3>
              <p className="text-foreground leading-relaxed">{analysis.summary}</p>
            </Card>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="tests" className="space-y-4">
            {analysis.testResults.map((test, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{test.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-primary">{test.value}</span>
                      <span className="text-sm text-muted-foreground">{test.unit}</span>
                      <Badge className={getStatusColor(test.status)}>
                        {isArabic 
                          ? (test.status === 'normal' ? 'طبيعي' : test.status === 'high' ? 'مرتفع' : 'منخفض')
                          : test.status.toUpperCase()
                        }
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{isArabic ? 'المعدل الطبيعي:' : 'Normal Range:'}</div>
                    <div className="font-medium">{test.normalRange}</div>
                  </div>
                </div>

                <Separator className="my-3" />
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm mb-1 text-primary">
                      {isArabic ? '🩺 التفسير الطبي:' : '🩺 Medical Explanation:'}
                    </h5>
                    <p className="text-sm text-foreground">{test.medicalExplanation}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-1 text-secondary">
                      {isArabic ? '💬 التفسير المبسط:' : '💬 Simple Explanation:'}
                    </h5>
                    <p className="text-sm text-muted-foreground">{test.simpleExplanation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Abnormal Values Tab */}
          <TabsContent value="abnormal" className="space-y-4">
            {analysis.abnormalValues.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-green-600 mb-2">
                  <Activity className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {isArabic ? '🎉 ممتاز!' : '🎉 Excellent!'}
                </h3>
                <p className="text-muted-foreground">
                  {isArabic ? 'جميع القيم ضمن المعدلات الطبيعية' : 'All values are within normal ranges'}
                </p>
              </Card>
            ) : (
              analysis.abnormalValues.map((abnormal, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{abnormal.testName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-red-600">{abnormal.currentValue}</span>
                        <Badge className={getSeverityColor(abnormal.severity)}>
                          {isArabic 
                            ? (abnormal.severity === 'mild' ? 'طفيف' : abnormal.severity === 'moderate' ? 'متوسط' : 'شديد')
                            : abnormal.severity.toUpperCase()
                          }
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{isArabic ? 'المعدل الطبيعي:' : 'Normal Range:'}</div>
                      <div className="font-medium">{abnormal.normalRange}</div>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div>
                    <h5 className="font-medium text-sm mb-1">
                      {isArabic ? '📋 السبب المحتمل:' : '📋 Possible Cause:'}
                    </h5>
                    <p className="text-sm text-foreground">{abnormal.explanation}</p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {/* General Suggestions */}
            {analysis.suggestions.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span>
                  {isArabic ? 'النصائح العامة' : 'General Recommendations'}
                </h3>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Recommended Tests */}
            {analysis.recommendedTests.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🔬</span>
                  {isArabic ? 'تحاليل إضافية مقترحة' : 'Recommended Additional Tests'}
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendedTests.map((test, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      <span className="text-sm">{test}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Specialist Consultation */}
            {analysis.specialistConsultation && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                  <span>👨‍⚕️</span>
                  {isArabic ? 'استشارة طبيب مختص' : 'Specialist Consultation'}
                </h3>
                <p className="text-sm text-blue-700">
                  {isArabic ? 'يُنصح بمراجعة: ' : 'Recommended to consult: '}
                  <span className="font-medium">{analysis.specialistConsultation}</span>
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Medical Disclaimer */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-medium">
                {isArabic ? '⚠️ تنبيه طبي مهم' : '⚠️ Important Medical Notice'}
              </p>
              <p>
                {isArabic 
                  ? 'هذا التفسير مبني على الذكاء الاصطناعي لأغراض تعليمية فقط. لا يُعتبر تشخيصاً طبياً أو بديلاً عن استشارة طبيب مختص.'
                  : 'This AI-powered interpretation is for educational purposes only. It is not a medical diagnosis or substitute for professional medical consultation.'
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onDownloadPDF}
            variant="medical"
            className="flex-1"
          >
            <Download className="w-4 h-4" />
            {isArabic ? '💾 تحميل التقرير PDF' : '💾 Download PDF Report'}
          </Button>
          
          <Button 
            onClick={handleCopy}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4" />
            {isArabic ? '📋 نسخ التحليل' : '📋 Copy Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StructuredAnalysisResult;