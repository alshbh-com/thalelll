import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface PrivacySettingsProps {
  language: string;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ language }) => {
  const { toast } = useToast();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState(30);
  const [explanationStyle, setExplanationStyle] = useState('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isArabic = language === 'ar';

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_mode, auto_delete_days, preferred_explanation_style')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error loading user settings:', error);
        return;
      }

      if (data) {
        setPrivacyMode(data.privacy_mode || false);
        setAutoDeleteDays(data.auto_delete_days || 30);
        setExplanationStyle(data.preferred_explanation_style || 'simple');
      }
    } catch (error) {
      console.error('Unexpected error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: isArabic ? "تسجيل الدخول مطلوب" : "Login Required",
          description: isArabic ? "يجب تسجيل الدخول لحفظ الإعدادات" : "Please login to save settings",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          privacy_mode: privacyMode,
          auto_delete_days: autoDeleteDays,
          preferred_explanation_style: explanationStyle
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: isArabic ? "خطأ في الحفظ" : "Save Error",
          description: isArabic ? "فشل في حفظ الإعدادات" : "Failed to save settings",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isArabic ? "تم الحفظ" : "Settings Saved",
        description: isArabic ? "تم حفظ إعداداتك بنجاح" : "Your settings have been saved successfully",
      });
    } catch (error) {
      console.error('Unexpected error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllData = async () => {
    if (!confirm(isArabic 
      ? 'هل أنت متأكد من حذف جميع بياناتك؟ هذا الإجراء لا يمكن التراجع عنه.'
      : 'Are you sure you want to delete all your data? This action cannot be undone.'
    )) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete analysis results (this will cascade to chat messages due to foreign key)
      const { error: analysisError } = await supabase
        .from('analysis_results')
        .delete()
        .eq('user_id', user.id);

      if (analysisError) {
        console.error('Error deleting analysis results:', analysisError);
        toast({
          title: isArabic ? "خطأ في الحذف" : "Delete Error",
          description: isArabic ? "فشل في حذف بعض البيانات" : "Failed to delete some data",
          variant: "destructive",
        });
        return;
      }

      // Delete chat messages
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (chatError) {
        console.error('Error deleting chat messages:', chatError);
      }

      toast({
        title: isArabic ? "تم الحذف" : "Data Deleted",
        description: isArabic ? "تم حذف جميع بياناتك بنجاح" : "All your data has been deleted successfully",
      });
    } catch (error) {
      console.error('Unexpected error deleting data:', error);
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "حدث خطأ أثناء حذف البيانات" : "An error occurred while deleting data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          {isArabic ? 'إعدادات الخصوصية' : 'Privacy Settings'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Privacy Mode */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="font-medium">
                {isArabic ? 'وضع الخصوصية القصوى' : 'Maximum Privacy Mode'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'تفعيل الحذف التلقائي للبيانات بعد فترة محددة'
                  : 'Enable automatic data deletion after specified period'
                }
              </p>
            </div>
            <Switch
              checked={privacyMode}
              onCheckedChange={setPrivacyMode}
            />
          </div>

          {privacyMode && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    {isArabic ? 'وضع الخصوصية مُفعّل' : 'Privacy Mode Enabled'}
                  </p>
                  <p>
                    {isArabic 
                      ? 'سيتم حذف جميع التحاليل والمحادثات تلقائياً بعد المدة المحددة'
                      : 'All analyses and chats will be automatically deleted after the specified period'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Separator />

        {/* Auto Delete Days */}
        <div className="space-y-2">
          <Label className="font-medium">
            {isArabic ? 'مدة الاحتفاظ بالبيانات (أيام)' : 'Data Retention Period (Days)'}
          </Label>
          <Select value={autoDeleteDays.toString()} onValueChange={(value) => setAutoDeleteDays(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">
                {isArabic ? '7 أيام' : '7 Days'}
              </SelectItem>
              <SelectItem value="30">
                {isArabic ? '30 يوم' : '30 Days'}
              </SelectItem>
              <SelectItem value="90">
                {isArabic ? '90 يوم' : '90 Days'}
              </SelectItem>
              <SelectItem value="365">
                {isArabic ? 'سنة واحدة' : '1 Year'}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isArabic 
              ? 'ستطبق هذه الإعدادات على التحاليل الجديدة فقط'
              : 'This setting applies to new analyses only'
            }
          </p>
        </div>

        <Separator />

        {/* Explanation Style */}
        <div className="space-y-2">
          <Label className="font-medium">
            {isArabic ? 'أسلوب التفسير المفضل' : 'Preferred Explanation Style'}
          </Label>
          <Select value={explanationStyle} onValueChange={setExplanationStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">
                {isArabic ? 'مبسط (للمرضى العاديين)' : 'Simple (For Regular Patients)'}
              </SelectItem>
              <SelectItem value="medical">
                {isArabic ? 'طبي (للأطباء والمختصين)' : 'Medical (For Healthcare Professionals)'}
              </SelectItem>
              <SelectItem value="both">
                {isArabic ? 'كلاهما (تفسير مزدوج)' : 'Both (Dual Explanation)'}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isArabic 
              ? 'يؤثر على طريقة عرض التحاليل وأسلوب المساعد الذكي'
              : 'Affects how results are displayed and AI assistant responses'
            }
          </p>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={saveSettings}
            disabled={isSaving}
            className="flex-1"
          >
            <Settings className="w-4 h-4" />
            {isSaving 
              ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
              : (isArabic ? 'حفظ الإعدادات' : 'Save Settings')
            }
          </Button>
          
          <Button 
            onClick={deleteAllData}
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4" />
            {isArabic ? 'حذف جميع البيانات' : 'Delete All Data'}
          </Button>
        </div>

        {/* Security Note */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">
                {isArabic ? 'معلومات الأمان' : 'Security Information'}
              </p>
              <ul className="space-y-1 text-xs">
                <li>
                  {isArabic 
                    ? '• جميع البيانات مشفرة وآمنة'
                    : '• All data is encrypted and secure'
                  }
                </li>
                <li>
                  {isArabic 
                    ? '• لا نشارك معلوماتك مع أطراف ثالثة'
                    : '• We never share your information with third parties'
                  }
                </li>
                <li>
                  {isArabic 
                    ? '• يمكنك حذف بياناتك في أي وقت'
                    : '• You can delete your data at any time'
                  }
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;