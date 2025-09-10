-- Create missing profile for the authenticated user
INSERT INTO public.profiles (id, user_id, name, profile_type, email, created_at, updated_at)
VALUES (
  '482860b9-d660-42a0-8401-c33370d57f5f',
  '482860b9-d660-42a0-8401-c33370d57f5f',
  'Zeteny',
  'vezetoi',
  'business.zeteny@gmail.com',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  profile_type = EXCLUDED.profile_type,
  email = EXCLUDED.email,
  updated_at = now();