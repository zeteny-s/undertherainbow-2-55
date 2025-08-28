-- Drop the constraint first
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_profile_type_check;