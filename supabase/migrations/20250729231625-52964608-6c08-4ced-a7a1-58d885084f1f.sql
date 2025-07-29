-- Add file URL columns to payroll_summaries table
ALTER TABLE public.payroll_summaries 
ADD COLUMN IF NOT EXISTS payroll_file_url TEXT,
ADD COLUMN IF NOT EXISTS tax_file_url TEXT;