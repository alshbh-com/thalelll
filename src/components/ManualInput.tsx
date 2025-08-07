import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ManualInputProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const ManualInput: React.FC<ManualInputProps> = ({ value, onChange, language }) => {
  const isArabic = language === 'ar';

  const placeholder = isArabic 
    ? `مثال:
Hemoglobin = 13.5 g/dL
WBC = 6.2 ×10⁹/L
Glucose (Fasting) = 95 mg/dL
Cholesterol = 180 mg/dL
Creatinine = 1.0 mg/dL

أدخل نتائج التحاليل هنا...`
    : `Example:
Hemoglobin = 13.5 g/dL
WBC = 6.2 ×10⁹/L
Glucose (Fasting) = 95 mg/dL
Cholesterol = 180 mg/dL
Creatinine = 1.0 mg/dL

Enter your lab results here...`;

  return (
    <div className="space-y-3">
      <Label htmlFor="manual-input" className="text-sm font-medium text-foreground">
        {isArabic ? 'أدخل نتائج التحاليل يدوياً' : 'Enter Lab Results Manually'}
      </Label>
      <Textarea
        id="manual-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] resize-none border-primary/20 focus:border-primary"
        dir={isArabic ? 'rtl' : 'ltr'}
      />
      <p className="text-xs text-muted-foreground">
        {isArabic 
          ? 'يمكنك نسخ النتائج من تقرير التحليل أو كتابتها بالتفصيل'
          : 'You can copy results from your lab report or type them in detail'
        }
      </p>
    </div>
  );
};

export default ManualInput;