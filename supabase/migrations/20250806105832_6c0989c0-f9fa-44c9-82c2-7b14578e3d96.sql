-- Update profile types for manager accounts
-- Set specific accounts to be managers (vezetoi)
UPDATE public.profiles 
SET profile_type = 'vezetoi', updated_at = now()
WHERE email IN ('business.zeteny@gmail.com', 'info@undertherainbow.hu') 
   OR name IN ('business.zeteny@gmail.com', 'info@undertherainbow.hu', 'Zeteny');