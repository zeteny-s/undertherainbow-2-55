-- 1) Create enum for permissions
DO $$ BEGIN
  CREATE TYPE public.document_permission AS ENUM ('viewer','editor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Create folders table
CREATE TABLE IF NOT EXISTS public.document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID NULL REFERENCES public.document_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

-- Owner full access
DO $$ BEGIN
  CREATE POLICY "Users can manage their own folders" ON public.document_folders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  folder_id UUID NULL REFERENCES public.document_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  file_type TEXT NULL,
  file_size INTEGER NULL,
  scanned_pdf BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4) Shares table
CREATE TABLE IF NOT EXISTS public.document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID NULL, -- internal user share
  email TEXT NULL,       -- external email share (record keeping)
  permission public.document_permission NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT document_shares_target_ck CHECK (shared_with IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_document_shares_doc ON public.document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON public.document_shares(shared_with);

ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- 5) Helper functions for access control
CREATE OR REPLACE FUNCTION public.can_access_document_by_id(_doc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _doc_id AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.document_shares s
        WHERE s.document_id = d.id AND s.shared_with = auth.uid()
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_document(_doc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _doc_id AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.document_shares s
        WHERE s.document_id = d.id AND s.shared_with = auth.uid() AND s.permission = 'editor'
      )
    )
  );
$$;

-- Map storage object name to document
CREATE OR REPLACE FUNCTION public.can_access_document_object(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.storage_path = _name AND (
      d.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.document_shares s
        WHERE s.document_id = d.id AND s.shared_with = auth.uid()
      )
    )
  );
$$;

-- 6) RLS policies
-- documents: owner full access
DO $$ BEGIN
  CREATE POLICY "Owners can manage their documents" ON public.documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- documents: shared users can view
DO $$ BEGIN
  CREATE POLICY "Shared users can view documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.can_access_document_by_id(id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- documents: shared editors can update title/description/metadata (RLS allows update; app should limit fields)
DO $$ BEGIN
  CREATE POLICY "Shared editors can update documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.can_edit_document(id))
  WITH CHECK (public.can_edit_document(id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- document_shares policies
DO $$ BEGIN
  CREATE POLICY "Owners manage shares" ON public.document_shares
  FOR ALL TO authenticated
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Recipients can view their shares" ON public.document_shares
  FOR SELECT TO authenticated
  USING (shared_with = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- folders: already owner managed above

-- 7) Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow owner to upload into own folder path
DO $$ BEGIN
  CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owner read/update/delete
DO $$ BEGIN
  CREATE POLICY "Owners can manage their storage objects" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Shared users can read via policy using helper function
DO $$ BEGIN
  CREATE POLICY "Shared users can read document objects" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.can_access_document_object(name)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8) Timestamp trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_docs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_document_folders
  BEFORE UPDATE ON public.document_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_docs();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_docs();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;