-- Add waitlisted column to form_submissions table
ALTER TABLE public.form_submissions 
ADD COLUMN waitlisted BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient waitlist queries
CREATE INDEX idx_form_submissions_waitlist ON public.form_submissions(form_id, waitlisted, submitted_at);

-- Add waitlist_position column for ordering
ALTER TABLE public.form_submissions 
ADD COLUMN waitlist_position INTEGER NULL;