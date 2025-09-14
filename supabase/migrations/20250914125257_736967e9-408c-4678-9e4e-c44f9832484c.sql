-- Add capacity fields to forms table
ALTER TABLE public.forms 
ADD COLUMN capacity integer,
ADD COLUMN unlimited_capacity boolean DEFAULT false;

-- Add family_name to form_submissions table for public display
ALTER TABLE public.form_submissions 
ADD COLUMN family_name text;

-- Create index for better performance on submission queries
CREATE INDEX idx_form_submissions_form_id_date ON public.form_submissions(form_id, submitted_at DESC);

-- Add capacity management functions
CREATE OR REPLACE FUNCTION public.get_form_submission_count(form_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer FROM public.form_submissions WHERE form_id = form_id_param;
$function$;

CREATE OR REPLACE FUNCTION public.is_form_full(form_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN f.unlimited_capacity = true THEN false
      WHEN f.capacity IS NULL THEN false
      ELSE (SELECT COUNT(*) FROM public.form_submissions WHERE form_id = form_id_param) >= f.capacity
    END
  FROM public.forms f
  WHERE f.id = form_id_param;
$function$;