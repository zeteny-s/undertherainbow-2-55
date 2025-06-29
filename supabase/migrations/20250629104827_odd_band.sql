/*
  # Backup System Setup

  1. New Tables
    - `backup_schedule` - Stores backup scheduling information
    - `backup_history` - Tracks backup execution history

  2. Functions
    - Function to create backup schedule table
    - Function to log backup executions

  3. Security
    - Enable RLS on backup tables
    - Add policies for authenticated users
*/

-- Create backup schedule table
CREATE TABLE IF NOT EXISTS backup_schedule (
  id integer PRIMARY KEY DEFAULT 1,
  next_backup timestamptz NOT NULL,
  frequency text NOT NULL DEFAULT 'biweekly',
  day_of_week integer NOT NULL DEFAULT 1, -- Monday
  hour integer NOT NULL DEFAULT 2, -- 02:00 AM
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_schedule CHECK (id = 1)
);

-- Create backup history table
CREATE TABLE IF NOT EXISTS backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date timestamptz NOT NULL DEFAULT now(),
  backup_filename text NOT NULL,
  invoice_count integer NOT NULL DEFAULT 0,
  files_downloaded integer NOT NULL DEFAULT 0,
  backup_size_mb numeric NOT NULL DEFAULT 0,
  google_drive_file_id text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'in_progress')),
  error_message text,
  backup_period_start timestamptz NOT NULL,
  backup_period_end timestamptz NOT NULL,
  execution_time_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE backup_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- Create policies for backup tables
CREATE POLICY "Allow authenticated users to read backup schedule"
  ON backup_schedule
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update backup schedule"
  ON backup_schedule
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read backup history"
  ON backup_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role to manage backup history"
  ON backup_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to create backup schedule table (for edge function)
CREATE OR REPLACE FUNCTION create_backup_schedule_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function is called from the edge function to ensure table exists
  -- The table creation is already handled above, so this is just a placeholder
  NULL;
END;
$$;

-- Create function to log backup execution
CREATE OR REPLACE FUNCTION log_backup_execution(
  p_backup_filename text,
  p_invoice_count integer,
  p_files_downloaded integer,
  p_backup_size_mb numeric,
  p_google_drive_file_id text,
  p_status text,
  p_error_message text DEFAULT NULL,
  p_backup_period_start timestamptz DEFAULT NULL,
  p_backup_period_end timestamptz DEFAULT NULL,
  p_execution_time_seconds integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_id uuid;
BEGIN
  INSERT INTO backup_history (
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
$$;

-- Create function to update next backup date
CREATE OR REPLACE FUNCTION update_next_backup_date()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_next timestamptz;
  new_next timestamptz;
BEGIN
  -- Get current next backup date
  SELECT next_backup INTO current_next
  FROM backup_schedule
  WHERE id = 1;
  
  -- Calculate next backup date (2 weeks from current)
  new_next := current_next + interval '14 days';
  
  -- Update the schedule
  UPDATE backup_schedule
  SET 
    next_backup = new_next,
    updated_at = now()
  WHERE id = 1;
END;
$$;

-- Insert initial backup schedule (every 2 weeks on Monday at 02:00 AM)
INSERT INTO backup_schedule (
  id,
  next_backup,
  frequency,
  day_of_week,
  hour,
  enabled
) VALUES (
  1,
  -- Calculate next Monday at 02:00 AM
  date_trunc('week', now()) + interval '1 week' + interval '2 hours',
  'biweekly',
  1, -- Monday
  2, -- 02:00 AM
  true
) ON CONFLICT (id) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_backup_schedule_updated_at
  BEFORE UPDATE ON backup_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();