-- Create families table
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  house_leader_id UUID NOT NULL,
  child_name TEXT,
  child_age INTEGER,
  start_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_interactions table
CREATE TABLE public.family_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  house_leader_id UUID NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT NOT NULL CHECK (category IN ('welcome_meeting', 'fall_development', 'winter_friendship', 'spring_planning', 'summer_wrapup', 'daily_interaction', 'community_event', 'problem_solving', 'referral_moment')),
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  satisfaction_level INTEGER CHECK (satisfaction_level >= 1 AND satisfaction_level <= 5),
  referral_opportunity BOOLEAN DEFAULT false,
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create annual_progress table to track yearly goals
CREATE TABLE public.annual_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  house_leader_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL, -- e.g., "2024-2025"
  total_hours NUMERIC DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  last_interaction_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(house_leader_id, family_id, academic_year)
);

-- Enable Row Level Security
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families
CREATE POLICY "House leaders can view their own families" 
ON public.families 
FOR SELECT 
USING (house_leader_id = auth.uid());

CREATE POLICY "House leaders can create families" 
ON public.families 
FOR INSERT 
WITH CHECK (house_leader_id = auth.uid());

CREATE POLICY "House leaders can update their own families" 
ON public.families 
FOR UPDATE 
USING (house_leader_id = auth.uid());

CREATE POLICY "House leaders can delete their own families" 
ON public.families 
FOR DELETE 
USING (house_leader_id = auth.uid());

-- RLS Policies for family_interactions
CREATE POLICY "House leaders can view their own interactions" 
ON public.family_interactions 
FOR SELECT 
USING (house_leader_id = auth.uid());

CREATE POLICY "House leaders can create interactions" 
ON public.family_interactions 
FOR INSERT 
WITH CHECK (house_leader_id = auth.uid());

CREATE POLICY "House leaders can update their own interactions" 
ON public.family_interactions 
FOR UPDATE 
USING (house_leader_id = auth.uid());

CREATE POLICY "House leaders can delete their own interactions" 
ON public.family_interactions 
FOR DELETE 
USING (house_leader_id = auth.uid());

-- RLS Policies for annual_progress
CREATE POLICY "House leaders can view their own progress" 
ON public.annual_progress 
FOR SELECT 
USING (house_leader_id = auth.uid());

CREATE POLICY "House leaders can manage their own progress" 
ON public.annual_progress 
FOR ALL 
USING (house_leader_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_families_updated_at
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_interactions_updated_at
BEFORE UPDATE ON public.family_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annual_progress_updated_at
BEFORE UPDATE ON public.annual_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically update annual progress when interactions are added
CREATE OR REPLACE FUNCTION public.update_annual_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    NEW.duration_minutes / 60.0, 
    1, 
    NEW.interaction_date::date
  )
  ON CONFLICT (house_leader_id, family_id, academic_year)
  DO UPDATE SET
    total_hours = annual_progress.total_hours + (NEW.duration_minutes / 60.0),
    total_interactions = annual_progress.total_interactions + 1,
    last_interaction_date = GREATEST(annual_progress.last_interaction_date, NEW.interaction_date::date),
    updated_at = now();
    
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_annual_progress_on_interaction
AFTER INSERT ON public.family_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_annual_progress();