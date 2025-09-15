-- Drop existing policy and create more specific ones
DROP POLICY IF EXISTS "Admin/manager can manage all google calendars" ON public.google_calendars;

-- Allow users to create their own calendars
CREATE POLICY "Users can create their own google calendars" 
ON public.google_calendars 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Allow users to view and update their own calendars
CREATE POLICY "Users can manage their own google calendars" 
ON public.google_calendars 
FOR ALL 
USING (auth.uid() = created_by);

-- Allow admins and managers to manage all calendars
CREATE POLICY "Admins and managers can manage all google calendars" 
ON public.google_calendars 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.profile_type = ANY(ARRAY['adminisztracio'::text, 'vezetoi'::text])
));