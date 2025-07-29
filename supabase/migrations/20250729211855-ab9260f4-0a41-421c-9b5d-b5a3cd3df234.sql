-- Add tax_amount column to payroll_summaries table
ALTER TABLE public.payroll_summaries 
ADD COLUMN tax_amount numeric DEFAULT 0 NOT NULL;