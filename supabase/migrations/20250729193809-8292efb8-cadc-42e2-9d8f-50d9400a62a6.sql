-- Add missing user_id column to profiles table and create profile for current user
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

-- Update existing profiles to have user_id = id
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Make user_id not null after updating existing records
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;

-- Create profile for current authenticated users if it doesn't exist
INSERT INTO public.profiles (id, user_id, name, profile_type)
SELECT 
  id, 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email, 'User') as name,
  'alkalmazott' as profile_type
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.id;