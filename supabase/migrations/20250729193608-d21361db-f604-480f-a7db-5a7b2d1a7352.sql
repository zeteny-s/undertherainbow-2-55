-- Fix RLS policies for payroll tables to allow authenticated users to save payroll data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only managers can manage payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Only managers can manage payroll summaries" ON public.payroll_summaries;

-- Create more permissive policies for payroll_records
CREATE POLICY "Users can view their own payroll records" 
ON public.payroll_records 
FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can create payroll records" 
ON public.payroll_records 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own payroll records" 
ON public.payroll_records 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own payroll records" 
ON public.payroll_records 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create more permissive policies for payroll_summaries
CREATE POLICY "Users can view their own payroll summaries" 
ON public.payroll_summaries 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create payroll summaries" 
ON public.payroll_summaries 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own payroll summaries" 
ON public.payroll_summaries 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own payroll summaries" 
ON public.payroll_summaries 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create a function to auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, profile_type)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'alkalmazott')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profiles
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();