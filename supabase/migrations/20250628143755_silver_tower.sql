/*
  # Update RLS policies for authenticated users

  1. Security Changes
    - Update RLS policies to require authentication
    - Remove anonymous access to invoices table
    - Ensure only authenticated users can access invoice data

  2. Policy Updates
    - Modify existing policies to only allow authenticated users
    - Remove anon role from all policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow invoice inserts for all users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice selects for all users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice updates for all users" ON invoices;
DROP POLICY IF EXISTS "Allow invoice deletes for all users" ON invoices;

-- Create new policies for authenticated users only
CREATE POLICY "Allow invoice inserts for authenticated users"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow invoice selects for authenticated users"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow invoice updates for authenticated users"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow invoice deletes for authenticated users"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (true);

-- Update storage policies for invoices bucket (if not already set)
-- Note: This assumes the invoices bucket exists and needs authenticated access
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create storage policies for authenticated users
CREATE POLICY "Authenticated users can upload invoices"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can view invoices"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can update invoices"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can delete invoices"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices');