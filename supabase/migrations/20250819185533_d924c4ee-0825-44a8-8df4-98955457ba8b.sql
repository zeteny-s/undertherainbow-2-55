-- CRM Tables
CREATE TABLE public.crm_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  source TEXT,
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.crm_customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proposal' CHECK (status IN ('proposal', 'negotiation', 'closed_won', 'closed_lost')),
  close_date DATE,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project Management Tables
CREATE TABLE public.pm_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  team_members TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pm_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.pm_projects(id) ON DELETE CASCADE,
  board_id UUID REFERENCES public.pm_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  assigned_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  labels TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pm_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.pm_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_comments ENABLE ROW LEVEL SECURITY;

-- CRM Policies
CREATE POLICY "Users can manage their own CRM customers" ON public.crm_customers
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all CRM customers" ON public.crm_customers
FOR SELECT USING (is_current_user_manager() = true);

CREATE POLICY "Users can manage their own CRM leads" ON public.crm_leads
FOR ALL USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Managers can view all CRM leads" ON public.crm_leads
FOR SELECT USING (is_current_user_manager() = true);

CREATE POLICY "Users can manage their own CRM deals" ON public.crm_deals
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all CRM deals" ON public.crm_deals
FOR SELECT USING (is_current_user_manager() = true);

-- Project Management Policies
CREATE POLICY "Project creators and members can manage projects" ON public.pm_projects
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid() = created_by OR 
  auth.uid()::text = ANY(team_members)
);

CREATE POLICY "Managers can view all projects" ON public.pm_projects
FOR SELECT USING (is_current_user_manager() = true);

CREATE POLICY "Project team members can manage boards" ON public.pm_boards
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.pm_projects 
    WHERE auth.uid() = user_id OR auth.uid() = created_by OR auth.uid()::text = ANY(team_members)
  )
);

CREATE POLICY "Project team members can manage tasks" ON public.pm_tasks
FOR ALL USING (
  project_id IN (
    SELECT id FROM public.pm_projects 
    WHERE auth.uid() = user_id OR auth.uid() = created_by OR auth.uid()::text = ANY(team_members)
  ) OR auth.uid() = assigned_to
);

CREATE POLICY "Users can manage comments on accessible tasks" ON public.pm_comments
FOR ALL USING (
  task_id IN (
    SELECT id FROM public.pm_tasks t
    WHERE t.project_id IN (
      SELECT id FROM public.pm_projects 
      WHERE auth.uid() = user_id OR auth.uid() = created_by OR auth.uid()::text = ANY(team_members)
    ) OR t.assigned_to = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_crm_customers_updated_at
  BEFORE UPDATE ON public.crm_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pm_projects_updated_at
  BEFORE UPDATE ON public.pm_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pm_boards_updated_at
  BEFORE UPDATE ON public.pm_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pm_tasks_updated_at
  BEFORE UPDATE ON public.pm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pm_comments_updated_at
  BEFORE UPDATE ON public.pm_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();