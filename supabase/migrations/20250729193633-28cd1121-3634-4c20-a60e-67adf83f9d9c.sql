-- Fix security warning for function search path
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, profile_type)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'alkalmazott')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;