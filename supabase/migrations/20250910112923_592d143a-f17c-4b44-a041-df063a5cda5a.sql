-- Create enum for campus types
CREATE TYPE public.campus_type AS ENUM ('Feketerigó', 'Torockó', 'Levél');

-- Create enum for form status
CREATE TYPE public.form_status AS ENUM ('active', 'inactive');

-- Create forms table
CREATE TABLE public.forms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    campus campus_type NOT NULL,
    status form_status NOT NULL DEFAULT 'active',
    form_components JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_submissions table
CREATE TABLE public.form_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
    submission_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT
);

-- Enable RLS on forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on form_submissions table
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for forms table
CREATE POLICY "Only admin/manager can manage forms" 
ON public.forms 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND profile_type IN ('adminisztracio', 'vezetoi')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND profile_type IN ('adminisztracio', 'vezetoi')
    )
);

-- Create RLS policies for form_submissions table
CREATE POLICY "Admin/manager can view all submissions" 
ON public.form_submissions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND profile_type IN ('adminisztracio', 'vezetoi')
    )
);

CREATE POLICY "Anyone can submit forms" 
ON public.form_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();