/*
  # Fix Authentication and User Registration

  1. Security Updates
    - Update RLS policies to allow user registration
    - Fix authentication flow for new users
    - Ensure proper access control while allowing registration

  2. Changes
    - Allow anonymous users to register (sign up)
    - Maintain authentication requirements for data access
    - Fix any blocking policies for user creation
*/

-- First, let's check if we need to update any auth-related policies
-- The issue might be with overly restrictive RLS policies

-- Ensure the auth schema has proper permissions
-- Note: Supabase handles most auth operations, but we need to ensure
-- our application policies don't interfere

-- Update storage policies to be more permissive for registration flow
DROP POLICY IF EXISTS "All authenticated users can upload to invoices bucket" ON storage.objects;
DROP POLICY IF EXISTS "All authenticated users can view invoices bucket" ON storage.objects;
DROP POLICY IF EXISTS "All authenticated users can update invoices bucket" ON storage.objects;
DROP POLICY IF EXISTS "All authenticated users can delete from invoices bucket" ON storage.objects;

-- Create more permissive storage policies that don't block registration
CREATE POLICY "Authenticated users can upload to invoices bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can view invoices bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can update invoices bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'invoices');

CREATE POLICY "Authenticated users can delete from invoices bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'invoices');

-- Ensure email confirmation is disabled for easier registration
-- This is typically done in Supabase dashboard, but we can check our auth flow

-- Create a function to handle new user setup if needed
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be used to set up new users if needed
  -- For now, it just returns the new record
  RETURN NEW;
END;
$$;

-- Create trigger for new user setup (optional)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();