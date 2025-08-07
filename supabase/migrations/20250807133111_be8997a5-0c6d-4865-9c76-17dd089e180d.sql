-- Add file URL columns to payroll_summaries table
ALTER TABLE public.payroll_summaries 
ADD COLUMN payroll_file_url text,
ADD COLUMN cash_file_url text;