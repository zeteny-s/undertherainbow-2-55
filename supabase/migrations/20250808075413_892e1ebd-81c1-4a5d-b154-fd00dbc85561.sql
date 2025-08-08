-- Add cash_file_url column to payroll_summaries table
ALTER TABLE public.payroll_summaries 
ADD COLUMN cash_file_url text;