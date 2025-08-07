-- Add cash payment tracking to payroll records
ALTER TABLE public.payroll_records 
ADD COLUMN IF NOT EXISTS is_cash boolean NOT NULL DEFAULT false;

-- Add cash payment breakdown to payroll summaries
ALTER TABLE public.payroll_summaries
ADD COLUMN IF NOT EXISTS cash_costs numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_transfer_costs numeric NOT NULL DEFAULT 0;