-- Add status field to newsletters table to track draft/published state
ALTER TABLE public.newsletters 
ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Add check constraint for valid status values
ALTER TABLE public.newsletters 
ADD CONSTRAINT newsletters_status_check 
CHECK (status IN ('draft', 'published'));

-- Create index for better performance when filtering by status
CREATE INDEX idx_newsletters_status ON public.newsletters(status);

-- Update existing newsletters to be published (assuming they were completed)
UPDATE public.newsletters SET status = 'published' WHERE generated_html IS NOT NULL;