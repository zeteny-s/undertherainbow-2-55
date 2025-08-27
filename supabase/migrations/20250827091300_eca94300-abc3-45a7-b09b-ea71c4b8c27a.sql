-- Update existing 'irodai' profile types to 'adminisztracio'
UPDATE public.profiles 
SET profile_type = 'adminisztracio' 
WHERE profile_type = 'irodai';

-- Update the default value for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN profile_type SET DEFAULT 'adminisztracio';