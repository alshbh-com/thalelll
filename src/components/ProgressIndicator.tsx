import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface ProgressIndicatorProps {
  isAnalyzing: boolean;
  language: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ isAnalyzing, language }) => {
  const [progress, setProgress] = React.useState(0);
  const isArabic = language === 'ar';

  React.useEffect(() => {
    if (isAnalyzing) {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 95);
        });
      }, 300);

      return () => {
        clearInterval(timer);
      };
    } else {
      setProgress(0);
    }
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const stages = isArabic ? [
    'قراءة البيانات...',
    'تحليل النتائج...',
    'مقارنة بالقيم الطبيعية...',
    'إعداد التفسير...',
    'جاري الانتهاء...'
  ] : [
    'Reading data...',
    'Analyzing results...',
    'Comparing with normal ranges...',
    'Preparing explanation...',
    'Finalizing...'
  ];

  const currentStage = Math.min(Math.floor(progress / 20), stages.length - 1);

  return (
    <Card className="soft-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <h3 className="font-medium text-foreground">
              {isArabic ? 'جاري تحليل النتائج...' : 'Analyzing Results...'}
            </h3>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{stages[currentStage]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="text-xs text-muted-foreground" dir={isArabic ? 'rtl' : 'ltr'}>
            {isArabic 
              ? 'يقوم الذكاء الاصطناعي بتحليل نتائجك بعناية لتقديم تفسير دقيق وموثوق'
              : 'AI is carefully analyzing your results to provide accurate and reliable interpretation'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressIndicator;