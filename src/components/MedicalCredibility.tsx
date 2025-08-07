import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, BookOpen, Users, AlertTriangle } from 'lucide-react';

interface MedicalCredibilityProps {
  language: string;
}

const MedicalCredibility: React.FC<MedicalCredibilityProps> = ({ language }) => {
  const isArabic = language === 'ar';

  return (
    <Card className="soft-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          {isArabic ? 'المصداقية والموثوقية' : 'Credibility & Reliability'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Technology */}
        <div className="flex items-start gap-3">
          <div className="medical-gradient p-2 rounded-lg">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">
              {isArabic ? 'تقنية الذكاء الاصطناعي المتقدمة' : 'Advanced AI Technology'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isArabic 
                ? 'نستخدم أحدث نماذج الذكاء الاصطناعي المدربة على آلاف المراجع الطبية والدراسات العلمية المحكمة'
                : 'We use the latest AI models trained on thousands of medical references and peer-reviewed scientific studies'
              }
            </p>
          </div>
        </div>

        {/* Medical Guidelines */}
        <div className="flex items-start gap-3">
          <div className="medical-gradient p-2 rounded-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">
              {isArabic ? 'الإرشادات الطبية المعتمدة' : 'Approved Medical Guidelines'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isArabic 
                ? 'التفسيرات مبنية على المراجع الطبية المعتمدة من منظمة الصحة العالمية والجمعيات الطبية الدولية'
                : 'Interpretations are based on medical references approved by WHO and international medical associations'
              }
            </p>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-2">
                {isArabic ? '⚠️ إخلاء مسؤولية طبية' : '⚠️ Medical Disclaimer'}
              </h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>
                  {isArabic 
                    ? 'هذا التطبيق يقدم معلومات تعليمية فقط ولا يُعتبر بديلاً عن الاستشارة الطبية المتخصصة.'
                    : 'This application provides educational information only and is not a substitute for professional medical consultation.'
                  }
                </p>
                <p>
                  {isArabic 
                    ? 'يُنصح بشدة بمراجعة الطبيب المختص لتفسير النتائج والحصول على التشخيص والعلاج المناسب.'
                    : 'It is strongly recommended to consult with a qualified healthcare provider for proper interpretation, diagnosis, and treatment.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* References */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-foreground mb-3">
            {isArabic ? 'المراجع العلمية:' : 'Scientific References:'}
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>• World Health Organization (WHO) Laboratory Guidelines</div>
            <div>• American Association for Clinical Chemistry (AACC)</div>
            <div>• International Federation of Clinical Chemistry (IFCC)</div>
            <div>• European Association for Laboratory Medicine (EFLM)</div>
            <div className="text-xs text-muted-foreground/70 mt-2">
              {isArabic 
                ? 'تم تحديث قاعدة البيانات آخر مرة: ديسمبر 2024'
                : 'Database last updated: December 2024'
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalCredibility;