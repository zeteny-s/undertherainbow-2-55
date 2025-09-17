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
      jsonb_each.key as component_id,
      CASE 
        -- Handle array values (checkboxes)
        WHEN jsonb_typeof(jsonb_each.value) = 'array' THEN 
          (SELECT array_agg(elem_value::text) 
           FROM jsonb_array_elements_text(jsonb_each.value) as elem_value)
        -- Handle single values (radio, dropdown) - convert to text
        WHEN jsonb_typeof(jsonb_each.value) = 'string' THEN 
          ARRAY[jsonb_each.value #>> '{}']
        ELSE 
          ARRAY[]::text[]
      END as selected_options
    FROM public.form_submissions fs,
    LATERAL jsonb_each(fs.submission_data) as jsonb_each
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
      AND sc.selected_options[1] IS NOT NULL 
      AND sc.selected_options[1] != ''
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

  -- Reset counts to 0 for options that have no current selections
  UPDATE public.form_option_capacity
  SET 
    current_count = 0,
    updated_at = now()
  WHERE form_id = NEW.form_id
    AND id NOT IN (
      SELECT DISTINCT foc2.id
      FROM public.form_option_capacity foc2
      JOIN (
        WITH submission_counts AS (
          SELECT 
            fs.form_id,
            jsonb_each.key as component_id,
            CASE 
              WHEN jsonb_typeof(jsonb_each.value) = 'array' THEN 
                (SELECT array_agg(elem_value::text) 
                 FROM jsonb_array_elements_text(jsonb_each.value) as elem_value)
              WHEN jsonb_typeof(jsonb_each.value) = 'string' THEN 
                ARRAY[jsonb_each.value #>> '{}']
              ELSE 
                ARRAY[]::text[]
            END as selected_options
          FROM public.form_submissions fs,
          LATERAL jsonb_each(fs.submission_data) as jsonb_each
          WHERE fs.form_id = NEW.form_id
        )
        SELECT 
          sc.component_id,
          unnest(sc.selected_options) as option_value
        FROM submission_counts sc
        WHERE array_length(sc.selected_options, 1) > 0
          AND sc.selected_options[1] IS NOT NULL 
          AND sc.selected_options[1] != ''
      ) as active_options ON foc2.component_id = active_options.component_id 
                           AND foc2.option_value = active_options.option_value
      WHERE foc2.form_id = NEW.form_id
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