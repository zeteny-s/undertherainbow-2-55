-- Storage RLS policies to allow authenticated users to upload and read payroll and tax documents

-- Allow authenticated users to upload to specific buckets
CREATE POLICY IF NOT EXISTS "Authenticated users can upload payroll and tax documents"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('payroll', 'tax-documents'));

-- Allow authenticated users to read from specific buckets
CREATE POLICY IF NOT EXISTS "Authenticated users can read payroll and tax documents"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('payroll', 'tax-documents'));
