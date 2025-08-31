-- Add support for multiple teachers per class
-- First, add a new column for multiple pedagogus IDs
ALTER TABLE public.classes ADD COLUMN pedagogus_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Update existing records to move single pedagogus_id to the array
UPDATE public.classes 
SET pedagogus_ids = CASE 
  WHEN pedagogus_id IS NOT NULL THEN ARRAY[pedagogus_id]
  ELSE ARRAY[]::UUID[]
END;

-- Create index for better performance on pedagogus_ids queries
CREATE INDEX idx_classes_pedagogus_ids ON public.classes USING GIN(pedagogus_ids);

-- Update RLS policies to work with the new pedagogus_ids array
DROP POLICY IF EXISTS "Pedagógus can view their assigned classes" ON public.classes;
CREATE POLICY "Pedagógus can view their assigned classes" 
ON public.classes 
FOR SELECT 
USING (auth.uid() = ANY(pedagogus_ids));

-- Update attendance_records policies to work with multiple teachers
DROP POLICY IF EXISTS "Admin/Manager can create attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin/Manager can update attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin/Manager can delete attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin/Manager can view all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Pedagógus can manage attendance for their classes" ON public.attendance_records;

CREATE POLICY "Admin/Manager can create attendance records" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (
  is_current_user_admin_or_manager() 
  OR EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_id AND auth.uid() = ANY(c.pedagogus_ids)
  )
);

CREATE POLICY "Admin/Manager can update attendance records" 
ON public.attendance_records 
FOR UPDATE 
USING (
  is_current_user_admin_or_manager() 
  OR EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_id AND auth.uid() = ANY(c.pedagogus_ids)
  )
)
WITH CHECK (
  is_current_user_admin_or_manager() 
  OR EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_id AND auth.uid() = ANY(c.pedagogus_ids)
  )
);

CREATE POLICY "Admin/Manager can delete attendance records" 
ON public.attendance_records 
FOR DELETE 
USING (
  is_current_user_admin_or_manager() 
  OR EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_id AND auth.uid() = ANY(c.pedagogus_ids)
  )
);

CREATE POLICY "Admin/Manager can view all attendance records" 
ON public.attendance_records 
FOR SELECT 
USING (
  is_current_user_admin_or_manager() 
  OR EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = class_id AND auth.uid() = ANY(c.pedagogus_ids)
  )
);

-- Update students policy to work with multiple teachers
DROP POLICY IF EXISTS "Pedagógus can view students in their classes" ON public.students;
CREATE POLICY "Pedagógus can view students in their classes" 
ON public.students 
FOR SELECT 
USING (
  class_id IN (
    SELECT classes.id 
    FROM classes 
    WHERE auth.uid() = ANY(classes.pedagogus_ids)
  )
);