-- ===========================
-- COMPREHENSIVE CRM & PROJECT MANAGEMENT BACKEND
-- ===========================

-- Add missing columns to existing CRM customers table (one by one)
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'subscriber';
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.crm_customers ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC DEFAULT 0;

-- Add constraints for lifecycle_stage
ALTER TABLE public.crm_customers DROP CONSTRAINT IF EXISTS crm_customers_lifecycle_stage_check;
ALTER TABLE public.crm_customers ADD CONSTRAINT crm_customers_lifecycle_stage_check 
  CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist'));

-- Enhance existing leads table
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS last_contact_method TEXT;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Enhance existing deals table  
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'prospecting';
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS deal_owner_id UUID;
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.crm_deals ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Add constraints for deal stage
ALTER TABLE public.crm_deals DROP CONSTRAINT IF EXISTS crm_deals_stage_check;
ALTER TABLE public.crm_deals ADD CONSTRAINT crm_deals_stage_check 
  CHECK (stage IN ('prospecting', 'qualification', 'needs_analysis', 'value_proposition', 'id_decision_makers', 'perception_analysis', 'proposal_price_quote', 'negotiation_review', 'closed_won', 'closed_lost'));

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
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'general';
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.crm_customers(id);
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS total_budget NUMERIC DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS spent_budget NUMERIC DEFAULT 0;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS project_manager_id UUID;
ALTER TABLE public.pm_projects ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add constraints for project type and progress
ALTER TABLE public.pm_projects DROP CONSTRAINT IF EXISTS pm_projects_project_type_check;
ALTER TABLE public.pm_projects ADD CONSTRAINT pm_projects_project_type_check 
  CHECK (project_type IN ('general', 'client_work', 'internal', 'marketing', 'development', 'design'));

ALTER TABLE public.pm_projects DROP CONSTRAINT IF EXISTS pm_projects_progress_check;
ALTER TABLE public.pm_projects ADD CONSTRAINT pm_projects_progress_check 
  CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

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