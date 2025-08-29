-- Convert one existing user to pedagogus for testing
UPDATE public.profiles 
SET profile_type = 'pedagogus' 
WHERE name = 'Dénes Máté';