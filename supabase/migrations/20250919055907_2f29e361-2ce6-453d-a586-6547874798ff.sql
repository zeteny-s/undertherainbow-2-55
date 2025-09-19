-- Create functions to increment view counts
CREATE OR REPLACE FUNCTION public.increment_form_view_count(form_id_param uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.forms 
  SET view_count = view_count + 1 
  WHERE id = form_id_param;
$$;

CREATE OR REPLACE FUNCTION public.increment_newsletter_view_count(newsletter_id_param uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.newsletters 
  SET view_count = view_count + 1 
  WHERE id = newsletter_id_param;
$$;