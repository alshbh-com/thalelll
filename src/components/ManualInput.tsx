import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from 'lucide-react';

interface ManualInputProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const ManualInput: React.FC<ManualInputProps> = ({ value, onChange, language }) => {
  const isArabic = language === 'ar';

  const placeholder = isArabic 
    ? `الهيموجلوبين = 13.5 g/dL
كريات الدم البيضاء = 6.2 ×10⁹/L
الجلوكوز الصائم = 95 mg/dL
الكوليسترول = 180 mg/dL
الكرياتينين = 1.0 mg/dL

أدخل نتائج التحاليل هنا...`
    : `Hemoglobin = 13.5 g/dL
WBC = 6.2 ×10⁹/L
Glucose (Fasting) = 95 mg/dL
Total Cholesterol = 180 mg/dL
Creatinine = 1.0 mg/dL

Enter your lab results here...`;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {isArabic ? 'إدخال نتائج التحاليل' : 'Enter Lab Results'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isArabic 
            ? 'اكتب نتائج تحاليلك أو انسخها من التقرير الطبي'
            : 'Type your lab results or copy them from your medical report'
          }
        </p>
      </div>
      
      <div className="relative">
        <Textarea
          id="manual-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[250px] resize-none border-2 border-dashed border-primary/30 focus:border-primary/60 bg-background/50 backdrop-blur-sm text-base placeholder:text-muted-foreground/50 placeholder:text-sm transition-all duration-300 hover:border-primary/40"
          dir={isArabic ? 'rtl' : 'ltr'}
        />
        <div className="absolute top-3 right-3 opacity-30">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">📋</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs">💡</span>
          </div>
          <p className="text-sm font-medium text-foreground">
            {isArabic ? 'نصائح للحصول على أفضل النتائج' : 'Tips for Best Results'}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-primary text-xs mt-1">•</span>
            <span className="text-xs text-muted-foreground">
              {isArabic 
                ? 'اكتب كل تحليل في سطر منفصل'
                : 'Write each test on a separate line'
              }
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary text-xs mt-1">•</span>
            <span className="text-xs text-muted-foreground">
              {isArabic 
                ? 'اذكر الوحدة مع القيمة'
                : 'Include units with values'
              }
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary text-xs mt-1">•</span>
            <span className="text-xs text-muted-foreground">
              {isArabic 
                ? 'يمكن استخدام الأسماء العربية أو الإنجليزية'
                : 'Use Arabic or English test names'
              }
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary text-xs mt-1">•</span>
            <span className="text-xs text-muted-foreground">
              {isArabic 
                ? 'انسخ النتائج مباشرة من التقرير'
                : 'Copy directly from your report'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInput;