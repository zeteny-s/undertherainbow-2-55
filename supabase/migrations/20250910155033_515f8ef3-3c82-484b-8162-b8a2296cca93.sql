-- Add 'draft' status to form_status enum
ALTER TYPE form_status ADD VALUE 'draft';

-- Update default status for new forms to be draft
ALTER TABLE public.forms ALTER COLUMN status SET DEFAULT 'draft';