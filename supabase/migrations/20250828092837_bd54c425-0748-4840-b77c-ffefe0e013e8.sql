-- First, update any remaining 'irodai' profiles to 'adminisztracio'
UPDATE public.profiles 
SET profile_type = 'adminisztracio' 
WHERE profile_type = 'irodai';

-- Now drop the old constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_profile_type_check;

-- Add the updated constraint with all new profile types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_profile_type_check 
CHECK (profile_type IN ('adminisztracio', 'pedagogus', 'haz_vezeto', 'vezetoi'));