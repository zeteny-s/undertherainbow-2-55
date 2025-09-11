-- Create newsletters table
CREATE TABLE public.newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  campus campus_type NOT NULL,
  content_guidelines TEXT,
  generated_html TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter_forms junction table
CREATE TABLE public.newsletter_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter_images table for storing uploaded images
CREATE TABLE public.newsletter_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_images ENABLE ROW LEVEL SECURITY;

-- Create policies for newsletters
CREATE POLICY "Admin/manager can manage newsletters" 
ON public.newsletters 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

-- Create policies for newsletter_forms
CREATE POLICY "Admin/manager can manage newsletter forms" 
ON public.newsletter_forms 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

-- Create policies for newsletter_images
CREATE POLICY "Admin/manager can manage newsletter images" 
ON public.newsletter_images 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

-- Create newsletters bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('newsletters', 'newsletters', true);

-- Create policies for newsletter storage
CREATE POLICY "Admin/manager can upload newsletter images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'newsletters' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

CREATE POLICY "Admin/manager can view newsletter images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'newsletters' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

CREATE POLICY "Newsletter images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'newsletters');

-- Add triggers for timestamps
CREATE TRIGGER update_newsletters_updated_at
BEFORE UPDATE ON public.newsletters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();