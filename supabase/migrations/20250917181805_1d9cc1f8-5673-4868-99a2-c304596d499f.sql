-- Create or replace the function to update option capacity counts
CREATE OR REPLACE FUNCTION public.update_option_capacity_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update capacity counts for all options in the form
  WITH submission_counts AS (
    SELECT 
      fs.form_id,
      jsonb_each_text.key as component_id,
      CASE 
        -- Handle array values (checkboxes)
        WHEN jsonb_typeof(jsonb_each_text.value) = 'array' THEN 
          (SELECT array_agg(elem_value::text) 
           FROM jsonb_array_elements_text(jsonb_each_text.value::jsonb) as elem_value)
        -- Handle single values (radio, dropdown)
        ELSE ARRAY[jsonb_each_text.value]
      END as selected_options
    FROM public.form_submissions fs,
    LATERAL jsonb_each_text(fs.submission_data) as jsonb_each_text
    WHERE fs.form_id = NEW.form_id
  ),
  option_counts AS (
    SELECT 
      sc.form_id,
      sc.component_id,
      unnest(sc.selected_options) as option_value,
      COUNT(*) as option_count
    FROM submission_counts sc
    WHERE array_length(sc.selected_options, 1) > 0
    GROUP BY sc.form_id, sc.component_id, unnest(sc.selected_options)
  )
  UPDATE public.form_option_capacity foc
  SET 
    current_count = COALESCE(oc.option_count, 0),
    updated_at = now()
  FROM option_counts oc
  WHERE foc.form_id = oc.form_id 
    AND foc.component_id = oc.component_id 
    AND foc.option_value = oc.option_value;

  -- Also reset counts for options that have no selections
  UPDATE public.form_option_capacity
  SET 
    current_count = 0,
    updated_at = now()
  WHERE form_id = NEW.form_id
    AND (component_id, option_value) NOT IN (
      SELECT component_id, option_value 
      FROM (
        WITH submission_counts AS (
          SELECT 
            fs.form_id,
            jsonb_each_text.key as component_id,
            CASE 
              WHEN jsonb_typeof(jsonb_each_text.value) = 'array' THEN 
                (SELECT array_agg(elem_value::text) 
                 FROM jsonb_array_elements_text(jsonb_each_text.value::jsonb) as elem_value)
              ELSE ARRAY[jsonb_each_text.value]
            END as selected_options
          FROM public.form_submissions fs,
          LATERAL jsonb_each_text(fs.submission_data) as jsonb_each_text
          WHERE fs.form_id = NEW.form_id
        )
        SELECT 
          sc.component_id,
          unnest(sc.selected_options) as option_value
        FROM submission_counts sc
        WHERE array_length(sc.selected_options, 1) > 0
      ) as active_options
    );
    
  RETURN NEW;
END;
$$;

-- Create trigger to update option capacity counts when form submissions are inserted
DROP TRIGGER IF EXISTS trigger_update_option_capacity_counts ON public.form_submissions;
CREATE TRIGGER trigger_update_option_capacity_counts
  AFTER INSERT ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_option_capacity_counts();

-- Update existing capacity counts for all forms to ensure accuracy
DO $$
DECLARE
  form_record RECORD;
BEGIN
  FOR form_record IN SELECT DISTINCT form_id FROM public.form_option_capacity LOOP
    -- Insert a dummy record to trigger the capacity update for existing forms
    INSERT INTO public.form_submissions (form_id, submission_data, family_name) 
    VALUES (form_record.form_id, '{}'::jsonb, 'TEMP_UPDATE_TRIGGER')
    ON CONFLICT DO NOTHING;
    
    -- Delete the dummy record
    DELETE FROM public.form_submissions 
    WHERE form_id = form_record.form_id 
      AND family_name = 'TEMP_UPDATE_TRIGGER' 
      AND submission_data = '{}'::jsonb;
  END LOOP;
END;
$$;