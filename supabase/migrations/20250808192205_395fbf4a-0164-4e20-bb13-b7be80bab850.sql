-- Add chat messages table for medical assistant
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_result_id UUID REFERENCES public.analysis_results(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN privacy_mode BOOLEAN DEFAULT false,
ADD COLUMN auto_delete_days INTEGER DEFAULT 30,
ADD COLUMN preferred_explanation_style TEXT DEFAULT 'simple' CHECK (preferred_explanation_style IN ('simple', 'medical', 'both'));

-- Add enhanced fields to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN structured_data JSONB,
ADD COLUMN risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
ADD COLUMN risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN suggestions TEXT[],
ADD COLUMN abnormal_values JSONB,
ADD COLUMN auto_delete_at TIMESTAMP WITH TIME ZONE;

-- Create policies for chat messages
CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_chat_messages_user_analysis ON public.chat_messages(user_id, analysis_result_id, created_at);
CREATE INDEX idx_analysis_results_auto_delete ON public.analysis_results(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- Create function to auto-delete old analysis results
CREATE OR REPLACE FUNCTION public.cleanup_expired_analysis_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analysis_results 
  WHERE auto_delete_at IS NOT NULL AND auto_delete_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set auto_delete_at when inserting analysis_results
CREATE OR REPLACE FUNCTION public.set_auto_delete_date()
RETURNS TRIGGER AS $$
DECLARE
  delete_days INTEGER;
BEGIN
  -- Get user's preferred auto_delete_days from profiles
  SELECT COALESCE(p.auto_delete_days, 30) INTO delete_days
  FROM public.profiles p 
  WHERE p.user_id = NEW.user_id;
  
  -- Only set auto_delete_at if privacy_mode is enabled
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND privacy_mode = true) THEN
    NEW.auto_delete_at = now() + (delete_days || ' days')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_analysis_auto_delete
  BEFORE INSERT ON public.analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.set_auto_delete_date();