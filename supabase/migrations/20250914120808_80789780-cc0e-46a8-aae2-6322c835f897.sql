-- Add a column to store newsletter components as JSON
ALTER TABLE newsletters ADD COLUMN components jsonb DEFAULT '[]'::jsonb;