-- Fix RLS policies to allow administration to see all profiles including pedagogus
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

-- Create new RLS policies for profiles
CREATE POLICY "Administration can view all profiles" ON public.profiles
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.profile_type IN ('adminisztracio', 'vezetoi')
  )
  OR id = auth.uid()
);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Create trigger to delete profiles when auth user is deleted
CREATE OR REPLACE FUNCTION public.delete_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Create trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.delete_user_profile();

-- Update existing profiles to ensure they have proper names from auth metadata
UPDATE public.profiles 
SET name = COALESCE(
  (SELECT au.raw_user_meta_data->>'name' 
   FROM auth.users au 
   WHERE au.id = profiles.user_id),
  profiles.name
)
WHERE profiles.name IS NULL OR profiles.name = '';

-- Drop the existing trigger and function, then recreate with proper name handling
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, name, profile_type, email)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'adminisztracio')::text,
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    profile_type = COALESCE(EXCLUDED.profile_type, profiles.profile_type),
    email = COALESCE(EXCLUDED.email, profiles.email);
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();