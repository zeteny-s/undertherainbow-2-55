-- Add view counts to forms and newsletters
ALTER TABLE public.forms 
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.newsletters 
ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Create view tracking table for more detailed analytics
CREATE TABLE public.form_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  newsletter_id UUID REFERENCES public.newsletters(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on view tracking tables
ALTER TABLE public.form_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for view tracking (allow public inserts for tracking)
CREATE POLICY "Anyone can track form views" ON public.form_views
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can track newsletter views" ON public.newsletter_views
FOR INSERT WITH CHECK (true);

-- Admins can see all view data
CREATE POLICY "Admins can view all form views" ON public.form_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
  )
);

CREATE POLICY "Admins can view all newsletter views" ON public.newsletter_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
  )
);