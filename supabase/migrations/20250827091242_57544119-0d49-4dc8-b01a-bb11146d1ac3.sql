-- Update profile types to include new account types
DO $$
BEGIN
    -- Add new profile types to the check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%profile_type%' 
        AND table_name = 'profiles'
    ) THEN
        -- Drop existing constraint and add new one
        ALTER TABLE public.profiles 
        DROP CONSTRAINT IF EXISTS profiles_profile_type_check;
        
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_profile_type_check 
        CHECK (profile_type IN ('adminisztracio', 'pedagogus', 'haz_vezeto', 'vezetoi'));
    END IF;

    -- Update existing 'irodai' profile types to 'adminisztracio'
    UPDATE public.profiles 
    SET profile_type = 'adminisztracio' 
    WHERE profile_type = 'irodai';

    -- Update the default value for new profiles
    ALTER TABLE public.profiles 
    ALTER COLUMN profile_type SET DEFAULT 'adminisztracio';
END $$;