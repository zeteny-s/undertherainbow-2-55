-- Update RLS policies to allow vezetoi (managers) to manage classes as well
DROP POLICY IF EXISTS "Adminisztráció can manage all classes" ON public.classes;

CREATE POLICY "Administration can manage all classes" 
ON public.classes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
));

-- Update students table policies to allow vezetoi as well
DROP POLICY IF EXISTS "Adminisztráció can manage all students" ON public.students;

CREATE POLICY "Administration can manage all students" 
ON public.students 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
));

-- Update attendance_records table policies to allow vezetoi to view all records
DROP POLICY IF EXISTS "Adminisztráció can view all attendance records" ON public.attendance_records;

CREATE POLICY "Administration can view all attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.profile_type IN ('adminisztracio', 'vezetoi')
));