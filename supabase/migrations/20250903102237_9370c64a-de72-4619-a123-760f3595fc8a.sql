-- Fix the function search path issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;