-- Update the profile creation function to use the profile_type from user metadata
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, user_id, name, profile_type)
  VALUES (
    NEW.id, 
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'profile_type', 'irodai')::text
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;