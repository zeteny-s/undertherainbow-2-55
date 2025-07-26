-- Fix security warnings by setting search_path for functions

-- Update the profile type function with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_profile_type()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT profile_type FROM public.profiles WHERE id = auth.uid();
$$;

-- Update the manager check function with proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_manager()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND profile_type = 'vezetoi'
  );
$$;