-- Update RLS policies to allow managers to delete any records

-- Drop existing restrictive policies for payroll_records
DROP POLICY IF EXISTS "Vezetoi accounts can delete payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Users can delete their own payroll records" ON public.payroll_records;

-- Create new policies for payroll_records deletion
CREATE POLICY "Managers can delete any payroll records" 
ON public.payroll_records 
FOR DELETE 
USING (is_current_user_manager() = true);

CREATE POLICY "Users can delete their own payroll records" 
ON public.payroll_records 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Drop existing restrictive policies for payroll_summaries
DROP POLICY IF EXISTS "Vezetoi accounts can delete payroll summaries" ON public.payroll_summaries;
DROP POLICY IF EXISTS "Users can delete their own payroll summaries" ON public.payroll_summaries;

-- Create new policies for payroll_summaries deletion
CREATE POLICY "Managers can delete any payroll summaries" 
ON public.payroll_summaries 
FOR DELETE 
USING (is_current_user_manager() = true);

CREATE POLICY "Users can delete their own payroll summaries" 
ON public.payroll_summaries 
FOR DELETE 
USING (auth.uid() = created_by);

-- Update invoices policy to ensure managers can delete any invoice
DROP POLICY IF EXISTS "Allow all authenticated users to delete invoices" ON public.invoices;

CREATE POLICY "Managers can delete any invoices" 
ON public.invoices 
FOR DELETE 
USING (is_current_user_manager() = true);

CREATE POLICY "Users can delete any invoices" 
ON public.invoices 
FOR DELETE 
USING (true);