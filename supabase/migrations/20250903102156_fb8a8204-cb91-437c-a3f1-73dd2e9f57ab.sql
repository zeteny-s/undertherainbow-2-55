-- Create house leaders table
CREATE TABLE public.house_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  max_families INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create families table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  primary_contact_name VARCHAR,
  primary_contact_email VARCHAR,
  primary_contact_phone VARCHAR,
  address TEXT,
  children_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create family assignments table
CREATE TABLE public.family_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_leader_id UUID NOT NULL REFERENCES public.house_leaders(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT now(),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed')),
  academic_year VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(house_leader_id, family_id, academic_year)
);

-- Create interaction types table
CREATE TABLE public.interaction_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  hour_value DECIMAL(3,2) NOT NULL,
  tier INTEGER CHECK (tier IN (1,2,3,4)),
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR DEFAULT 'MessageCircle',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parent interactions table
CREATE TABLE public.parent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_leader_id UUID NOT NULL REFERENCES public.house_leaders(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  interaction_type_id UUID NOT NULL REFERENCES public.interaction_types(id),
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  hour_value DECIMAL(3,2) NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  participants TEXT[] DEFAULT ARRAY[]::TEXT[],
  key_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  action_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  cultural_notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create annual progress table
CREATE TABLE public.annual_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_leader_id UUID NOT NULL REFERENCES public.house_leaders(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  academic_year VARCHAR NOT NULL,
  total_hours DECIMAL(4,2) DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  goal_hours DECIMAL(3,1) DEFAULT 15.0,
  last_interaction_date DATE,
  status VARCHAR DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'at_risk')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(house_leader_id, family_id, academic_year)
);

-- Enable RLS on all tables
ALTER TABLE public.house_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for house_leaders
CREATE POLICY "Users can view their own house leader profile"
ON public.house_leaders FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all house leaders"
ON public.house_leaders FOR SELECT
USING (is_current_user_admin_or_manager());

-- Create RLS policies for families
CREATE POLICY "House leaders can view assigned families"
ON public.families FOR SELECT
USING (
  id IN (
    SELECT fa.family_id FROM public.family_assignments fa
    JOIN public.house_leaders hl ON hl.id = fa.house_leader_id
    WHERE hl.user_id = auth.uid() AND fa.status = 'active'
  ) OR is_current_user_admin_or_manager()
);

-- Create RLS policies for family_assignments
CREATE POLICY "House leaders can view their assignments"
ON public.family_assignments FOR SELECT
USING (
  house_leader_id IN (
    SELECT id FROM public.house_leaders WHERE user_id = auth.uid()
  ) OR is_current_user_admin_or_manager()
);

-- Create RLS policies for interaction_types
CREATE POLICY "Authenticated users can view interaction types"
ON public.interaction_types FOR SELECT
USING (auth.role() = 'authenticated');

-- Create RLS policies for parent_interactions
CREATE POLICY "House leaders can manage their interactions"
ON public.parent_interactions FOR ALL
USING (
  house_leader_id IN (
    SELECT id FROM public.house_leaders WHERE user_id = auth.uid()
  ) OR is_current_user_admin_or_manager()
);

-- Create RLS policies for annual_progress
CREATE POLICY "House leaders can view their progress"
ON public.annual_progress FOR SELECT
USING (
  house_leader_id IN (
    SELECT id FROM public.house_leaders WHERE user_id = auth.uid()
  ) OR is_current_user_admin_or_manager()
);

-- Create function to update annual progress
CREATE OR REPLACE FUNCTION public.update_annual_progress()
RETURNS TRIGGER AS $$
DECLARE
  academic_year_calc TEXT;
BEGIN
  -- Calculate academic year (Sept 1 - Aug 31)
  IF EXTRACT(MONTH FROM NEW.interaction_date) >= 9 THEN
    academic_year_calc := EXTRACT(YEAR FROM NEW.interaction_date)::text || '-' || (EXTRACT(YEAR FROM NEW.interaction_date) + 1)::text;
  ELSE
    academic_year_calc := (EXTRACT(YEAR FROM NEW.interaction_date) - 1)::text || '-' || EXTRACT(YEAR FROM NEW.interaction_date)::text;
  END IF;

  INSERT INTO public.annual_progress (
    house_leader_id, 
    family_id, 
    academic_year, 
    total_hours, 
    total_interactions, 
    last_interaction_date
  )
  VALUES (
    NEW.house_leader_id, 
    NEW.family_id, 
    academic_year_calc, 
    NEW.hour_value, 
    1, 
    NEW.interaction_date::date
  )
  ON CONFLICT (house_leader_id, family_id, academic_year)
  DO UPDATE SET
    total_hours = annual_progress.total_hours + NEW.hour_value,
    total_interactions = annual_progress.total_interactions + 1,
    last_interaction_date = GREATEST(annual_progress.last_interaction_date, NEW.interaction_date::date),
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating annual progress
CREATE TRIGGER update_progress_after_interaction
  AFTER INSERT ON public.parent_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_annual_progress();

-- Create updated_at triggers
CREATE TRIGGER update_house_leaders_updated_at
  BEFORE UPDATE ON public.house_leaders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_interactions_updated_at
  BEFORE UPDATE ON public.parent_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annual_progress_updated_at
  BEFORE UPDATE ON public.annual_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default interaction types
INSERT INTO public.interaction_types (name, description, hour_value, tier, color, icon) VALUES
('Home Visit', 'In-person visit to family home', 2.0, 1, '#EF4444', 'Home'),
('Parent Conference', 'Scheduled formal meeting with parents', 1.5, 1, '#EF4444', 'Users'),
('Phone Call', 'Extended phone conversation', 0.5, 2, '#F59E0B', 'Phone'),
('Video Call', 'Virtual meeting via video platform', 0.75, 2, '#F59E0B', 'Video'),
('Email Exchange', 'Meaningful email correspondence', 0.25, 3, '#3B82F6', 'Mail'),
('Text Messages', 'Quick communication via text', 0.1, 4, '#10B981', 'MessageSquare'),
('School Event', 'Family participation in school events', 1.0, 3, '#3B82F6', 'Calendar'),
('Workshop/Training', 'Educational session for parents', 1.5, 2, '#F59E0B', 'BookOpen');