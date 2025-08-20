-- ===========================
-- COMPREHENSIVE CRM & PROJECT MANAGEMENT BACKEND
-- ===========================

-- Add missing columns to existing CRM tables for comprehensive functionality
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS 
  avatar_url TEXT,
  tags TEXT[],
  lead_score INTEGER DEFAULT 0,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist')),
  industry TEXT,
  website TEXT,
  linkedin_url TEXT,
  annual_revenue NUMERIC DEFAULT 0;

-- Enhance existing leads table
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS 
  contact_attempts INTEGER DEFAULT 0,
  last_contact_method TEXT,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  lead_score INTEGER DEFAULT 0,
  tags TEXT[];

-- Enhance existing deals table  
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS 
  stage TEXT DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'value_proposition', 'id_decision_makers', 'perception_analysis', 'proposal_price_quote', 'negotiation_review', 'closed_won', 'closed_lost')),
  expected_close_date DATE,
  deal_owner_id UUID,
  tags TEXT[],
  last_activity_date TIMESTAMP WITH TIME ZONE;

-- Create CRM Activities table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'proposal_sent', 'demo_scheduled', 'contract_signed')),
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  outcome TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM Communication History table
CREATE TABLE IF NOT EXISTS public.crm_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'phone', 'sms', 'linkedin', 'whatsapp', 'meeting')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT,
  metadata JSONB,
  communication_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance PM Projects table
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS 
  project_type TEXT DEFAULT 'general' CHECK (project_type IN ('general', 'client_work', 'internal', 'marketing', 'development', 'design')),
  client_id UUID REFERENCES public.crm_customers(id),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  total_budget NUMERIC DEFAULT 0,
  spent_budget NUMERIC DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  project_manager_id UUID,
  tags TEXT[];

-- Create Time Tracking table
CREATE TABLE IF NOT EXISTS public.time_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,  
  project_id UUID REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.pm_tasks(id) ON DELETE CASCADE,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  is_running BOOLEAN DEFAULT false,
  billable BOOLEAN DEFAULT true,
  hourly_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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
ALTER TABLE public.pm_tasks ADD COLUMN IF NOT EXISTS 
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  story_points INTEGER,
  task_type TEXT DEFAULT 'task' CHECK (task_type IN ('task', 'bug', 'feature', 'epic', 'story')),
  attachments_count INTEGER DEFAULT 0,
  watchers UUID[] DEFAULT ARRAY[]::UUID[];

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
-- RLS POLICIES
-- ===========================

-- Enable RLS on all tables
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_performance ENABLE ROW LEVEL SECURITY;

-- CRM Activities policies
CREATE POLICY "Users can manage their own CRM activities" ON public.crm_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all CRM activities" ON public.crm_activities
  FOR SELECT USING (is_current_user_manager() = true);

-- CRM Communications policies  
CREATE POLICY "Users can manage their own CRM communications" ON public.crm_communications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all CRM communications" ON public.crm_communications
  FOR SELECT USING (is_current_user_manager() = true);

-- Time Tracking policies
CREATE POLICY "Users can manage their own time tracking" ON public.time_tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Project team members can view time tracking" ON public.time_tracking
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.pm_projects 
      WHERE user_id = auth.uid() OR created_by = auth.uid() OR auth.uid()::text = ANY(team_members)
    )
  );

CREATE POLICY "Managers can view all time tracking" ON public.time_tracking
  FOR SELECT USING (is_current_user_manager() = true);

-- Project Templates policies
CREATE POLICY "Users can manage their own templates" ON public.project_templates
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can view public templates" ON public.project_templates
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Task Dependencies policies
CREATE POLICY "Project team members can manage task dependencies" ON public.task_dependencies
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM public.pm_tasks t
      JOIN public.pm_projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid() OR auth.uid()::text = ANY(p.team_members)
    )
  );

-- Task Attachments policies
CREATE POLICY "Project team members can manage task attachments" ON public.task_attachments
  FOR ALL USING (
    task_id IN (
      SELECT t.id FROM public.pm_tasks t
      JOIN public.pm_projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.created_by = auth.uid() OR auth.uid()::text = ANY(p.team_members)
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Team Performance policies
CREATE POLICY "Users can view their own performance" ON public.team_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all team performance" ON public.team_performance
  FOR SELECT USING (is_current_user_manager() = true);

CREATE POLICY "System can insert performance metrics" ON public.team_performance
  FOR INSERT WITH CHECK (true);

-- ===========================
-- TRIGGERS FOR UPDATED_AT
-- ===========================

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_tracking_updated_at
  BEFORE UPDATE ON public.time_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================
-- INDEXES FOR PERFORMANCE
-- ===========================

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON public.crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_id ON public.crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_crm_communications_user_id ON public.crm_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_communications_customer_id ON public.crm_communications(customer_id);

-- PM indexes
CREATE INDEX IF NOT EXISTS idx_time_tracking_user_id ON public.time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_project_id ON public.time_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_task_id ON public.time_tracking(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_team_performance_user_date ON public.team_performance(user_id, date);