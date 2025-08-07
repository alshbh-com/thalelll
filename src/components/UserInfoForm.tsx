import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface UserInfoFormProps {
  gender: string;
  age: string;
  language: string;
  onGenderChange: (value: string) => void;
  onAgeChange: (value: string) => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  gender,
  age,
  language,
  onGenderChange,
  onAgeChange
}) => {
  const isArabic = language === 'ar';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gender Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          {isArabic ? 'الجنس' : 'Gender'}
        </Label>
        <RadioGroup value={gender} onValueChange={onGenderChange} className="flex gap-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="cursor-pointer">
              {isArabic ? 'ذكر' : 'Male'}
            </Label>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="cursor-pointer">
              {isArabic ? 'أنثى' : 'Female'}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Age Input */}
      <div className="space-y-3">
        <Label htmlFor="age" className="text-sm font-medium text-foreground">
          {isArabic ? 'العمر' : 'Age'}
        </Label>
        <Input
          id="age"
          type="number"
          min="1"
          max="120"
          value={age}
          onChange={(e) => onAgeChange(e.target.value)}
          placeholder={isArabic ? 'أدخل العمر' : 'Enter age'}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default UserInfoForm;