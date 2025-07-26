-- Fix infinite recursion issues in RLS policies
-- Create security definer functions to avoid recursion

-- Function to get current user profile type
CREATE OR REPLACE FUNCTION public.get_current_user_profile_type()
RETURNS TEXT AS $$
  SELECT profile_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_current_user_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND profile_type = 'vezetoi'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can manage all team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Managers can manage all teams" ON public.teams;
DROP POLICY IF EXISTS "Office users can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view and update their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can view team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can manage all team tasks" ON public.team_tasks;
DROP POLICY IF EXISTS "Team members can view and update their team tasks" ON public.team_tasks;

-- Create new policies using security definer functions

-- Profiles policies
CREATE POLICY "Managers can view all profiles" ON public.profiles
FOR SELECT USING (public.is_current_user_manager() = true);

CREATE POLICY "Users can view and update their own profile" ON public.profiles
FOR ALL USING (id = auth.uid());

-- Teams policies  
CREATE POLICY "Managers can manage all teams" ON public.teams
FOR ALL USING (public.is_current_user_manager() = true);

CREATE POLICY "Office users can view their teams" ON public.teams
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_members.team_id = teams.id 
    AND team_members.user_id = auth.uid()
  )
);

-- Team members policies
CREATE POLICY "Managers can manage all team members" ON public.team_members
FOR ALL USING (public.is_current_user_manager() = true);

CREATE POLICY "Users can view their team memberships" ON public.team_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  team_id IN (
    SELECT tm.team_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Tasks policies
CREATE POLICY "Managers can manage all tasks" ON public.tasks
FOR ALL USING (public.is_current_user_manager() = true);

CREATE POLICY "Users can view and update their assigned tasks" ON public.tasks
FOR ALL USING (assigned_to = auth.uid());

CREATE POLICY "Team members can view team tasks" ON public.tasks
FOR SELECT USING (
  team_id IN (
    SELECT tm.team_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Team tasks policies
CREATE POLICY "Managers can manage all team tasks" ON public.team_tasks
FOR ALL USING (public.is_current_user_manager() = true);

CREATE POLICY "Team members can view and update their team tasks" ON public.team_tasks
FOR ALL USING (
  team_id IN (
    SELECT tm.team_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);