-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS "Allow public read access to published newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Allow public read access to newsletter forms" ON public.newsletter_forms;

-- Allow public read access to published newsletters
CREATE POLICY "Allow public read access to published newsletters"
ON public.newsletters 
FOR SELECT 
USING (status = 'published');

-- Allow public read access to newsletter_forms for published newsletters
CREATE POLICY "Allow public read access to newsletter forms"
ON public.newsletter_forms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.newsletters 
    WHERE id = newsletter_forms.newsletter_id 
    AND status = 'published'
  )
);