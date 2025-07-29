-- Create storage buckets for payroll and tax documents
INSERT INTO storage.buckets (id, name, public) VALUES ('payroll', 'payroll', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('tax-documents', 'tax-documents', false);

-- Create policies for payroll bucket
CREATE POLICY "Users can view their own payroll files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payroll' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own payroll files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payroll' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own payroll files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'payroll' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own payroll files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'payroll' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for tax-documents bucket
CREATE POLICY "Users can view their own tax document files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own tax document files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own tax document files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own tax document files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file reference columns to payroll_summaries table
ALTER TABLE public.payroll_summaries 
ADD COLUMN payroll_file_url text,
ADD COLUMN tax_file_url text;