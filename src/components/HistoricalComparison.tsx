import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface HistoricalData {
  date: string;
  testName: string;
  value: number;
  riskScore: number;
  riskLevel: string;
}

interface HistoricalComparisonProps {
  language: string;
  currentAnalysisId?: string;
}

const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({
  language,
  currentAnalysisId
}) => {
  const { toast } = useToast();
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const isArabic = language === 'ar';

  useEffect(() => {
    loadHistoricalData();
  }, [currentAnalysisId]);

  const loadHistoricalData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: isArabic ? "تسجيل الدخول مطلوب" : "Login Required",
          description: isArabic ? "يجب تسجيل الدخول لعرض السجل التاريخي" : "Please login to view historical data",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('analysis_results')
        .select('created_at, structured_data, risk_score, risk_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error loading historical data:', error);
        toast({
          title: isArabic ? "خطأ" : "Error",
          description: isArabic ? "فشل في تحميل البيانات التاريخية" : "Failed to load historical data",
          variant: "destructive",
        });
        return;
      }

      // Process the data
      const processedData: HistoricalData[] = [];
      data?.forEach((analysis) => {
        const date = new Date(analysis.created_at).toLocaleDateString();
        
        if (analysis.structured_data && typeof analysis.structured_data === 'object' && 'testResults' in analysis.structured_data) {
          (analysis.structured_data.testResults as any[]).forEach((test: any) => {
            // Try to extract numeric value
            const numericValue = parseFloat(test.value.toString().replace(/[^\d.-]/g, ''));
            if (!isNaN(numericValue)) {
              processedData.push({
                date,
                testName: test.name,
                value: numericValue,
                riskScore: analysis.risk_score || 75,
                riskLevel: analysis.risk_level || 'medium'
              });
            }
          });
        }
      });

      setHistoricalData(processedData);
      
      // Set default selected test to the most common one
      if (processedData.length > 0) {
        const testCounts = processedData.reduce((acc, item) => {
          acc[item.testName] = (acc[item.testName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const mostCommonTest = Object.keys(testCounts).reduce((a, b) => 
          testCounts[a] > testCounts[b] ? a : b
        );
        setSelectedTest(mostCommonTest);
      }
    } catch (error) {
      console.error('Unexpected error loading historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUniqueTests = () => {
    const tests = [...new Set(historicalData.map(item => item.testName))];
    return tests;
  };

  const getTestData = (testName: string) => {
    return historicalData
      .filter(item => item.testName === testName)
      .map(item => ({
        date: item.date,
        value: item.value,
        riskScore: item.riskScore
      }));
  };

  const getTrend = (testName: string) => {
    const data = getTestData(testName);
    if (data.length < 2) return 'stable';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'bg-green-100 text-green-800';
      case 'decreasing': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (historicalData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            {isArabic ? 'المقارنة التاريخية' : 'Historical Comparison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">
            {isArabic ? 'لا توجد بيانات تاريخية' : 'No Historical Data'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isArabic 
              ? 'قم بتحليل المزيد من التحاليل لمشاهدة التطور عبر الوقت'
              : 'Analyze more tests to see progress over time'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const uniqueTests = getUniqueTests();
  const chartData = getTestData(selectedTest);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          {isArabic ? 'المقارنة التاريخية' : 'Historical Comparison'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Test Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            {isArabic ? 'اختر التحليل:' : 'Select Test:'}
          </label>
          <div className="flex flex-wrap gap-2">
            {uniqueTests.map((test) => (
              <Button
                key={test}
                variant={selectedTest === test ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTest(test)}
                className="text-xs"
              >
                {test}
              </Button>
            ))}
          </div>
        </div>

        {/* Trend Summary */}
        {selectedTest && (
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{selectedTest}</h4>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'عدد القياسات:' : 'Measurements:'} {chartData.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(getTrend(selectedTest))}
                <Badge className={getTrendColor(getTrend(selectedTest))}>
                  {isArabic 
                    ? (getTrend(selectedTest) === 'increasing' ? 'متزايد' : getTrend(selectedTest) === 'decreasing' ? 'متناقص' : 'مستقر')
                    : getTrend(selectedTest).toUpperCase()
                  }
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Chart */}
        {selectedTest && chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => `${isArabic ? 'التاريخ:' : 'Date:'} ${value}`}
                  formatter={(value, name) => [
                    value,
                    name === 'value' ? (isArabic ? 'القيمة' : 'Value') : name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name={isArabic ? 'القيمة' : 'Value'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk Score Trend */}
        {selectedTest && chartData.length > 1 && (
          <div className="h-64">
            <h4 className="font-medium mb-3">
              {isArabic ? 'تطور مؤشر الأمان' : 'Safety Score Trend'}
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => `${isArabic ? 'التاريخ:' : 'Date:'} ${value}`}
                  formatter={(value) => [`${value}%`, isArabic ? 'مؤشر الأمان' : 'Safety Score']}
                />
                <Line 
                  type="monotone" 
                  dataKey="riskScore" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                  name={isArabic ? 'مؤشر الأمان' : 'Safety Score'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalComparison;