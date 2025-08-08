import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Bot, User, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  message_type: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MedicalChatAssistantProps {
  language: string;
  analysisResultId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const MedicalChatAssistant: React.FC<MedicalChatAssistantProps> = ({
  language,
  analysisResultId,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isArabic = language === 'ar';

  // Load chat history on component mount
  useEffect(() => {
    if (isOpen && analysisResultId) {
      loadChatHistory();
    }
  }, [isOpen, analysisResultId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('analysis_result_id', analysisResultId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
      } else {
        setMessages((data || []) as ChatMessage[]);
      }
    } catch (error) {
      console.error('Unexpected error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: 'temp-user-' + Date.now(),
      message_type: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('medical-chat-assistant', {
        body: {
          message: userMessage,
          language,
          analysisResultId,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }
      });

      if (error) {
        console.error('Chat error:', error);
        toast({
          title: isArabic ? "خطأ" : "Error",
          description: isArabic ? "حدث خطأ في المحادثة" : "Chat error occurred",
          variant: "destructive",
        });
        
        // Remove the temporary user message on error
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      } else {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: 'temp-assistant-' + Date.now(),
          message_type: 'assistant',
          content: data.response,
          created_at: new Date().toISOString()
        };
        
        // Replace temp user message with real one and add assistant response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          { ...tempUserMessage, id: 'user-' + Date.now() },
          assistantMessage
        ]);
      }
    } catch (error) {
      console.error('Unexpected chat error:', error);
      toast({
        title: isArabic ? "خطأ" : "Error",
        description: isArabic ? "حدث خطأ غير متوقع" : "Unexpected error occurred",
        variant: "destructive",
      });
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestionQuestions = isArabic ? [
    "ليه الكالسيوم عندي منخفض؟",
    "يعني إيه ALT مرتفع؟",
    "التحليل ده طبيعي؟",
    "محتاج أعمل تحاليل تانية؟"
  ] : [
    "Why is my calcium low?",
    "What does elevated ALT mean?",
    "Are these results normal?",
    "Do I need additional tests?"
  ];

  if (!isOpen) return null;

  return (
    <Card className="fixed inset-4 md:inset-8 z-50 shadow-2xl bg-background">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          {isArabic ? 'المساعد الطبي الذكي' : 'Smart Medical Assistant'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-16rem)]">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">
                  {isArabic ? 'أهلاً بك! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isArabic 
                    ? 'اسأل أي سؤال عن نتائج تحاليلك أو الصحة بشكل عام'
                    : 'Ask any question about your test results or health in general'
                  }
                </p>
              </div>
              
              {/* Suggestion Questions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic ? 'أسئلة مقترحة:' : 'Suggested questions:'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestionQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                      onClick={() => setInputMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.message_type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.message_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  
                  {message.message_type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">
                        {isArabic ? 'جاري الكتابة...' : 'Typing...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator className="my-4" />

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isArabic ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
            dir={isArabic ? 'rtl' : 'ltr'}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {isArabic 
            ? 'هذا المساعد للمعلومات التعليمية فقط - يُنصح بمراجعة طبيب مختص'
            : 'This assistant is for educational information only - Please consult a healthcare professional'
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalChatAssistant;