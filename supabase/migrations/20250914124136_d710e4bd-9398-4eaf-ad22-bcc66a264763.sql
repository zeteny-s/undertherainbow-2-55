-- Allow public access to active forms for form pages
CREATE POLICY "Allow public read access to active forms" 
ON public.forms 
FOR SELECT 
USING (status = 'active');