-- Add file URL columns to payroll_records table
ALTER TABLE public.payroll_records 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS extracted_text TEXT;