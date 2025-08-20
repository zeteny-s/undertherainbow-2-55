-- Continue with remaining tables and security fixes

-- Create Project Templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_boards JSONB DEFAULT '[]'::jsonb,
  default_tasks JSONB DEFAULT '[]'::jsonb,
  estimated_duration_days INTEGER,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Task Dependencies table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.pm_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.pm_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Create Task Attachments table
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.pm_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance PM Tasks table
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS story_points INTEGER;
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task';
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0;
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS watchers UUID[] DEFAULT ARRAY[]::UUID[];

-- Add constraint for task type
ALTER TABLE public.pm_tasks DROP CONSTRAINT IF EXISTS pm_tasks_task_type_check;
ALTER TABLE public.pm_tasks ADD CONSTRAINT pm_tasks_task_type_check 
  CHECK (task_type IN ('task', 'bug', 'feature', 'epic', 'story'));

-- Create Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'project_updated', 'deadline_reminder', 'crm_activity', 'deal_updated', 'lead_updated')),
  entity_type TEXT CHECK (entity_type IN ('task', 'project', 'deal', 'lead', 'customer')),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Team Performance Metrics table
CREATE TABLE IF NOT EXISTS public.team_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_assigned INTEGER DEFAULT 0,
  hours_logged NUMERIC DEFAULT 0,
  projects_active INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ===========================
-- ENABLE RLS ON ALL NEW TABLES
-- ===========================

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_performance ENABLE ROW LEVEL SECURITY;