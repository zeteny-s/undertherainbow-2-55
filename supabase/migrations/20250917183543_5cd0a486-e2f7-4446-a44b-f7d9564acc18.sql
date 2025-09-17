-- Allow public read access to form submissions for dropdown functionality
DROP POLICY IF EXISTS "Admin/manager can view all submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Anyone can submit forms" ON public.form_submissions;
DROP POLICY IF EXISTS "Admin/manager can delete submissions" ON public.form_submissions;

-- Create new policies for form submissions
CREATE POLICY "Anyone can view form submissions" 
ON public.form_submissions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can submit forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Admin/manager can delete submissions
CREATE POLICY "Admin/manager can delete submissions" 
ON public.form_submissions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.profile_type = ANY(ARRAY['adminisztracio', 'vezetoi'])
  )
);