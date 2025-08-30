-- Add foreign key constraints for proper cascading deletes
-- First, ensure attendance_records cascade when students are deleted
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;

ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_class_id_fkey;

ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Ensure students cascade when classes are deleted
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_class_id_fkey;

ALTER TABLE students 
ADD CONSTRAINT students_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;