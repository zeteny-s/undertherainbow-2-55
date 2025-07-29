-- Manually create profile for the current user if it doesn't exist
-- This will allow them to save payroll data immediately
INSERT INTO public.profiles (id, user_id, display_name, profile_type)
SELECT 
  id, 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email, 'User') as display_name,
  'alkalmazott' as profile_type
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;