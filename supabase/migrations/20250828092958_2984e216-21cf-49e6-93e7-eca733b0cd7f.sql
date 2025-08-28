-- Update all existing profile types to the new ones
UPDATE public.profiles 
SET profile_type = 'adminisztracio' 
WHERE profile_type NOT IN ('adminisztracio', 'pedagogus', 'haz_vezeto', 'vezetoi');

-- Now add back the constraint with new profile types
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_profile_type_check 
CHECK (profile_type IN ('adminisztracio', 'pedagogus', 'haz_vezeto', 'vezetoi'));