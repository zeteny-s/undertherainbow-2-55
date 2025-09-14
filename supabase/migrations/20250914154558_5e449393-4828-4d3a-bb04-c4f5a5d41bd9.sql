-- Create a dedicated bucket for form images that's publicly accessible
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-images', 'form-images', true);

-- Update storage policies to allow proper image uploads

-- Allow all authenticated users to upload newsletter images (not just admin/manager)
DROP POLICY IF EXISTS "Admin/manager can upload newsletter images" ON storage.objects;
CREATE POLICY "Authenticated users can upload newsletter images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'newsletters');

-- Allow all users (including anonymous) to upload form images
CREATE POLICY "Anyone can upload form images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'form-images');

-- Allow public read access to form images
CREATE POLICY "Form images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'form-images');

-- Allow authenticated users to manage their own form images
CREATE POLICY "Users can delete their own form images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'form-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own form images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'form-images' AND auth.uid()::text = (storage.foldername(name))[1]);