-- Create a global house cash state table (singleton)
CREATE TABLE IF NOT EXISTS public.house_cash_state (
  id integer PRIMARY KEY DEFAULT 1,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT house_cash_state_singleton CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.house_cash_state ENABLE ROW LEVEL SECURITY;

-- Policies: everyone authenticated can read; only managers can update
DROP POLICY IF EXISTS "Anyone can read house cash state" ON public.house_cash_state;
CREATE POLICY "Anyone can read house cash state"
ON public.house_cash_state
FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Managers can update house cash state" ON public.house_cash_state;
CREATE POLICY "Managers can update house cash state"
ON public.house_cash_state
FOR UPDATE
USING (is_current_user_manager() = true)
WITH CHECK (is_current_user_manager() = true);

-- Trigger to keep updated_at in sync
DROP TRIGGER IF EXISTS update_house_cash_state_updated_at ON public.house_cash_state;
CREATE TRIGGER update_house_cash_state_updated_at
BEFORE UPDATE ON public.house_cash_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial row if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.house_cash_state WHERE id = 1) THEN
    INSERT INTO public.house_cash_state (id, balance) VALUES (1, 0);
  END IF;
END$$;

-- Broaden visibility of house cash expenses so all users see the same list
-- Keep existing per-user manage policy; add a read-all policy
DROP POLICY IF EXISTS "Users can view all house cash expenses" ON public.house_cash_expenses;
CREATE POLICY "Users can view all house cash expenses"
ON public.house_cash_expenses
FOR SELECT
USING (auth.role() = 'authenticated');