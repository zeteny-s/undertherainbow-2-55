-- Create Google Calendar tables
CREATE TABLE public.google_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  google_calendar_id TEXT NOT NULL,
  share_link TEXT NOT NULL,
  campus campus_type NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_events_google (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.google_calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  teacher TEXT,
  event_type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events_google ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for google_calendars
CREATE POLICY "Admin/manager can manage all google calendars" 
ON public.google_calendars 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

CREATE POLICY "Allow public read access to google calendars" 
ON public.google_calendars 
FOR SELECT 
USING (true);

-- Create RLS policies for calendar_events_google
CREATE POLICY "Admin/manager can manage all calendar events" 
ON public.calendar_events_google 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));

CREATE POLICY "Allow public read access to calendar events" 
ON public.calendar_events_google 
FOR SELECT 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_google_calendars_updated_at
  BEFORE UPDATE ON public.google_calendars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_google_updated_at
  BEFORE UPDATE ON public.calendar_events_google
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();