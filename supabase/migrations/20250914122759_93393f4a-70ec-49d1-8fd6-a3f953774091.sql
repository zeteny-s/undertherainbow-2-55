-- Allow public access to published newsletters for preview
CREATE POLICY "Allow public read access to published newsletters" 
ON public.newsletters 
FOR SELECT 
USING (status = 'published');