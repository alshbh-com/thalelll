import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultProps {
  result: string;
  language: string;
  onDownloadPDF: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, language, onDownloadPDF }) => {
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: isArabic ? "تم النسخ" : "Copied",
        description: isArabic ? "تم نسخ التقرير بنجاح" : "Report copied successfully",
      });
    } catch (error) {
      toast({
        title: isArabic ? "خطأ" : "Error", 
        description: isArabic ? "فشل في نسخ التقرير" : "Failed to copy report",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full soft-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <span>📋</span>
          {isArabic ? 'تفسير نتائج التحاليل' : 'Lab Results Analysis'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analysis Content */}
        <div 
          className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg border"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {result}
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">
              {isArabic ? '⚠️ تنبيه طبي مهم' : '⚠️ Important Medical Notice'}
            </p>
            <p>
              {isArabic 
                ? 'المعلومات المقدمة هنا لأغراض تعليمية فقط ولا تُعتبر بديلاً عن الاستشارة الطبية المتخصصة. يُنصح بشدة بمراجعة الطبيب المختص لتفسير النتائج والحصول على التشخيص والعلاج المناسب.'
                : 'The information provided here is for educational purposes only and should not replace professional medical consultation. It is strongly recommended to consult with a qualified healthcare provider for proper interpretation, diagnosis, and treatment.'
              }
            </p>
          </div>
        </div>

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
            {isArabic ? '📋 نسخ التقرير' : '📋 Copy Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisResult;