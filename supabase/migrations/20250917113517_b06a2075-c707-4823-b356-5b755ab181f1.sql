-- Update forms table to support multiple campuses
ALTER TABLE public.forms 
DROP COLUMN campus;

-- Add new campuses column as an array
ALTER TABLE public.forms 
ADD COLUMN campuses text[] NOT NULL DEFAULT '{}';

-- Update existing records to have at least one campus
UPDATE public.forms 
SET campuses = ARRAY['Feketerigó'] 
WHERE campuses = '{}';

-- Add check constraint to ensure at least one campus is selected
ALTER TABLE public.forms 
ADD CONSTRAINT forms_campuses_not_empty 
CHECK (array_length(campuses, 1) > 0);

-- Add check constraint to ensure only valid campus values
ALTER TABLE public.forms 
ADD CONSTRAINT forms_campuses_valid 
CHECK (campuses <@ ARRAY['Feketerigó', 'Torockó', 'Levél']);

-- Update google_calendars table to support multiple campuses too
ALTER TABLE public.google_calendars 
DROP COLUMN campus;

ALTER TABLE public.google_calendars 
ADD COLUMN campuses text[] NOT NULL DEFAULT '{}';

UPDATE public.google_calendars 
SET campuses = ARRAY['Feketerigó'] 
WHERE campuses = '{}';

ALTER TABLE public.google_calendars 
ADD CONSTRAINT google_calendars_campuses_not_empty 
CHECK (array_length(campuses, 1) > 0);

ALTER TABLE public.google_calendars 
ADD CONSTRAINT google_calendars_campuses_valid 
CHECK (campuses <@ ARRAY['Feketerigó', 'Torockó', 'Levél']);