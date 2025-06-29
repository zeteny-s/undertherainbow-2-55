/*
  # Update RLS policies for shared data access

  1. Security Changes
    - Update RLS policies to allow all authenticated users to access all invoice data
    - This enables shared data access while maintaining authentication requirements
    - All users can see the same invoices but have individual user profiles

  2. Policy Updates
    - Modify existing policies to remove user-specific restrictions
    - Allow all authenticated users to perform CRUD operations on all invoices
    - Maintain authentication requirement for security
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow invoice inserts for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice selects for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice updates for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice deletes for authenticated users" ON invoices;

-- Create new shared access policies
CREATE POLICY "Allow all authenticated users to insert invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to select invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to update invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (true);

-- Update storage policies for shared access
DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete invoices" ON storage.objects;

-- Create new shared storage policies
CREATE POLICY "All authenticated users can upload to invoices bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "All authenticated users can view invoices bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "All authenticated users can update invoices bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "All authenticated users can delete from invoices bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices');