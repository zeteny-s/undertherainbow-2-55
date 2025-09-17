-- Add RLS policy to allow admin/manager to delete form submissions
CREATE POLICY "Admin/manager can delete submissions" 
ON public.form_submissions 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));