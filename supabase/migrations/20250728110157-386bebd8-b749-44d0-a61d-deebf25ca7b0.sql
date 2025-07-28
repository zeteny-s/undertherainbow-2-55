-- Create payroll_records table for storing processed payroll data
CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  project_code TEXT,
  amount NUMERIC NOT NULL,
  record_date DATE NOT NULL,
  is_rental BOOLEAN NOT NULL DEFAULT false,
  organization TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT,
  file_url TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll records (manager-only access)
CREATE POLICY "Only managers can manage payroll records" 
ON public.payroll_records 
FOR ALL 
USING (is_current_user_manager() = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON public.payroll_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create payroll_summaries table for monthly aggregations
CREATE TABLE public.payroll_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  organization TEXT NOT NULL,
  total_payroll NUMERIC NOT NULL DEFAULT 0,
  rental_costs NUMERIC NOT NULL DEFAULT 0,
  non_rental_costs NUMERIC NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, month, organization)
);

-- Enable Row Level Security
ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for payroll summaries (manager-only access)
CREATE POLICY "Only managers can manage payroll summaries" 
ON public.payroll_summaries 
FOR ALL 
USING (is_current_user_manager() = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_summaries_updated_at
BEFORE UPDATE ON public.payroll_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();