-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_analysis_results()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analysis_results 
  WHERE auto_delete_at IS NOT NULL AND auto_delete_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_auto_delete_date()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;