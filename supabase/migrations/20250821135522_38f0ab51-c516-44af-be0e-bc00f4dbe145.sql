-- ===========================
-- RLS POLICIES FOR ALL NEW TABLES
-- ===========================

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
-- TRIGGERS FOR UPDATED_AT COLUMNS
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
-- PERFORMANCE INDEXES
-- ===========================

-- CRM indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_user_id ON public.crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_customer_id ON public.crm_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_date ON public.crm_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON public.crm_activities(status);

CREATE INDEX IF NOT EXISTS idx_crm_communications_user_id ON public.crm_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_communications_customer_id ON public.crm_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_communications_date ON public.crm_communications(communication_date);

-- Enhanced CRM indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_crm_customers_user_id ON public.crm_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_lifecycle_stage ON public.crm_customers(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_customers_lead_score ON public.crm_customers(lead_score);

CREATE INDEX IF NOT EXISTS idx_crm_leads_user_id ON public.crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON public.crm_leads(lead_score);

CREATE INDEX IF NOT EXISTS idx_crm_deals_user_id ON public.crm_deals(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON public.crm_deals(status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON public.crm_deals(deal_owner_id);

-- PM indexes
CREATE INDEX IF NOT EXISTS idx_time_tracking_user_id ON public.time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_project_id ON public.time_tracking(project_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_task_id ON public.time_tracking(task_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_start_time ON public.time_tracking(start_time);
CREATE INDEX IF NOT EXISTS idx_time_tracking_is_running ON public.time_tracking(is_running);

CREATE INDEX IF NOT EXISTS idx_project_templates_created_by ON public.project_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_project_templates_public ON public.project_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments(uploaded_by);

-- Enhanced PM indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_pm_projects_user_id ON public.pm_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_projects_created_by ON public.pm_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_pm_projects_status ON public.pm_projects(status);
CREATE INDEX IF NOT EXISTS idx_pm_projects_project_manager ON public.pm_projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_pm_projects_client_id ON public.pm_projects(client_id);

CREATE INDEX IF NOT EXISTS idx_pm_tasks_project_id ON public.pm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_assigned_to ON public.pm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_status ON public.pm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_due_date ON public.pm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_task_type ON public.pm_tasks(task_type);

-- Notification and performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_team_performance_user_date ON public.team_performance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_team_performance_date ON public.team_performance(date);