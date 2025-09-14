-- Create family_contacts table to store kindergarten family email contacts
CREATE TABLE public.family_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  campus TEXT NOT NULL CHECK (campus IN ('Torockó', 'Feketerigó', 'Levél')),
  group_name TEXT NOT NULL,
  mother_email TEXT,
  father_email TEXT,
  additional_emails TEXT[], -- For cases where there are multiple emails
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for family contacts
CREATE POLICY "Admin/Manager can manage all family contacts" 
ON public.family_contacts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
  )
);

-- Create policy for viewing family contacts (all authenticated users can view)
CREATE POLICY "Authenticated users can view family contacts" 
ON public.family_contacts 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_contacts_updated_at
BEFORE UPDATE ON public.family_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_family_contacts_campus ON public.family_contacts(campus);
CREATE INDEX idx_family_contacts_group ON public.family_contacts(group_name);
CREATE INDEX idx_family_contacts_child_name ON public.family_contacts(child_name);