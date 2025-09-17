-- Add display_text field to form_option_capacity table for custom labeling
ALTER TABLE form_option_capacity 
ADD COLUMN display_text TEXT;