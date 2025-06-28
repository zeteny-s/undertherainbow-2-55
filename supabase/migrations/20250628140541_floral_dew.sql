/*
  # Create invoices table

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `file_name` (text)
      - `file_url` (text)
      - `organization` (text)
      - `uploaded_at` (timestamp)
      - `processed_at` (timestamp)
      - `status` (text)
      - `extracted_text` (text)
      - `partner` (text)
      - `bank_account` (text)
      - `subject` (text)
      - `invoice_number` (text)
      - `amount` (numeric)
      - `invoice_date` (date)
      - `payment_deadline` (date)
      - `payment_method` (text)
      - `invoice_type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `invoices` table
    - Add policy for public access (since this is an internal tool)
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text,
  organization text NOT NULL CHECK (organization IN ('alapitvany', 'ovoda')),
  uploaded_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  extracted_text text,
  partner text,
  bank_account text,
  subject text,
  invoice_number text,
  amount numeric,
  invoice_date date,
  payment_deadline date,
  payment_method text,
  invoice_type text CHECK (invoice_type IN ('bank_transfer', 'card_cash_afterpay')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on invoices"
  ON invoices
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();