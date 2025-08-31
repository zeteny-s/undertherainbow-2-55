-- Update attendance_records RLS policies to allow adminisztráció to see all records
DROP POLICY IF EXISTS "Administration can view all attendance records" ON public.attendance_records;

-- Create new policy using the security definer function we created earlier
CREATE POLICY "Admin/Manager can view all attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (is_current_user_admin_or_manager() OR pedagogus_id = auth.uid());

-- Also ensure adminisztráció can create attendance records for any class
CREATE POLICY "Admin/Manager can create attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (is_current_user_admin_or_manager() OR pedagogus_id = auth.uid());

-- Allow adminisztráció to update attendance records
CREATE POLICY "Admin/Manager can update attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (is_current_user_admin_or_manager() OR pedagogus_id = auth.uid())
WITH CHECK (is_current_user_admin_or_manager() OR pedagogus_id = auth.uid());

-- Allow adminisztráció to delete attendance records if needed
CREATE POLICY "Admin/Manager can delete attendance records" 
ON public.attendance_records 
FOR DELETE 
USING (is_current_user_admin_or_manager() OR pedagogus_id = auth.uid());