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

  const commonTests = isArabic ? [
    'الهيموجلوبين (Hemoglobin)',
    'كريات الدم البيضاء (WBC)',
    'الجلوكوز الصائم (Glucose)',
    'الكوليسترول (Cholesterol)',
    'الكرياتينين (Creatinine)',
    'إنزيمات الكبد (ALT/AST)',
    'فيتامين د (Vitamin D)',
    'هرمون الغدة الدرقية (TSH)'
  ] : [
    'Hemoglobin (Hb)',
    'White Blood Cells (WBC)',
    'Fasting Glucose',
    'Total Cholesterol',
    'Creatinine',
    'Liver Enzymes (ALT/AST)',
    'Vitamin D',
    'Thyroid Hormone (TSH)'
  ];

  const placeholder = isArabic 
    ? `مثال على تنسيق إدخال النتائج:

الهيموجلوبين = 13.5 g/dL
كريات الدم البيضاء = 6.2 ×10⁹/L
الجلوكوز الصائم = 95 mg/dL
الكوليسترول الكلي = 180 mg/dL
الكرياتينين = 1.0 mg/dL

أو يمكنك استخدام الأسماء الإنجليزية:
Hemoglobin = 13.5 g/dL
WBC = 6.2 ×10⁹/L
Glucose (Fasting) = 95 mg/dL

أدخل نتائج التحاليل هنا...`
    : `Example format for entering results:

Hemoglobin = 13.5 g/dL
WBC = 6.2 ×10⁹/L
Glucose (Fasting) = 95 mg/dL
Total Cholesterol = 180 mg/dL
Creatinine = 1.0 mg/dL

You can also use:
Hb: 13.5 g/dL
White Blood Cells: 6.2 ×10⁹/L
Fasting Glucose: 95 mg/dL

Enter your lab results here...`;

  return (
    <div className="space-y-4">
      <Label htmlFor="manual-input" className="text-sm font-medium text-foreground">
        {isArabic ? 'أدخل نتائج التحاليل يدوياً' : 'Enter Lab Results Manually'}
      </Label>
      
      {/* Common Tests Guide */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-primary mt-0.5" />
            <h4 className="text-sm font-medium text-foreground">
              {isArabic ? 'التحاليل الشائعة المدعومة:' : 'Common Supported Tests:'}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {commonTests.map((test, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className="text-primary">•</span>
                <span>{test}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Textarea
        id="manual-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[200px] resize-none border-primary/20 focus:border-primary"
        dir={isArabic ? 'rtl' : 'ltr'}
      />
      
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {isArabic 
            ? '💡 نصائح لإدخال أفضل:'
            : '💡 Tips for better input:'
          }
        </p>
        <ul className="text-xs text-muted-foreground space-y-1" dir={isArabic ? 'rtl' : 'ltr'}>
          <li>
            {isArabic 
              ? '• اكتب كل تحليل في سطر منفصل'
              : '• Write each test result on a separate line'
            }
          </li>
          <li>
            {isArabic 
              ? '• اذكر الوحدة (مثل g/dL, mg/dL)'
              : '• Include the unit (e.g., g/dL, mg/dL)'
            }
          </li>
          <li>
            {isArabic 
              ? '• يمكنك نسخ النتائج مباشرة من تقرير التحليل'
              : '• You can copy results directly from your lab report'
            }
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ManualInput;