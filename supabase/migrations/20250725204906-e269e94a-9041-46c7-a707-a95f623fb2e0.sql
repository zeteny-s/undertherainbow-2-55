-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.create_backup_schedule_table()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- This function is called from the edge function to ensure table exists
  -- The table creation is already handled above, so this is just a placeholder
  NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_backup_execution(p_backup_filename text, p_invoice_count integer, p_files_downloaded integer, p_backup_size_mb numeric, p_google_drive_file_id text, p_status text, p_error_message text DEFAULT NULL::text, p_backup_period_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_backup_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_execution_time_seconds integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  backup_id uuid;
BEGIN
  INSERT INTO public.backup_history (
    backup_filename,
    invoice_count,
    files_downloaded,
    backup_size_mb,
    google_drive_file_id,
    status,
    error_message,
    backup_period_start,
    backup_period_end,
    execution_time_seconds
  ) VALUES (
    p_backup_filename,
    p_invoice_count,
    p_files_downloaded,
    p_backup_size_mb,
    p_google_drive_file_id,
    p_status,
    p_error_message,
    COALESCE(p_backup_period_start, now() - interval '14 days'),
    COALESCE(p_backup_period_end, now()),
    p_execution_time_seconds
  ) RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_next_backup_date()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  current_next timestamptz;
  new_next timestamptz;
BEGIN
  -- Get current next backup date
  SELECT next_backup INTO current_next
  FROM public.backup_schedule
  WHERE id = 1;
  
  -- Calculate next backup date (2 weeks from current)
  new_next := current_next + interval '14 days';
  
  -- Update the schedule
  UPDATE public.backup_schedule
  SET 
    next_backup = new_next,
    updated_at = now()
  WHERE id = 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- This function can be used to set up new users if needed
  -- For now, it just returns the new record
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;