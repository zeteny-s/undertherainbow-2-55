-- Update the newsletter to published status so it can be viewed publicly
UPDATE public.newsletters 
SET status = 'published' 
WHERE id = '03dc8a94-410b-4389-8d83-0c660237cade';