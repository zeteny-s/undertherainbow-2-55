-- Fix storage RLS: allow authenticated users to upload and read payroll/tax documents

-- Upload policy
DROP POLICY IF EXISTS "Authenticated users can upload payroll and tax documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload payroll and tax documents"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('payroll', 'tax-documents'));

-- Read policy
DROP POLICY IF EXISTS "Authenticated users can read payroll and tax documents" ON storage.objects;
CREATE POLICY "Authenticated users can read payroll and tax documents"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('payroll', 'tax-documents'));
