-- Fix recursive RLS on team_members by using a SECURITY DEFINER helper
-- 1) Create helper function to check membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_current_user_in_team(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.team_id = _team_id
  );
$$;

-- 2) Replace the recursive SELECT policy on team_members
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;

CREATE POLICY "Users can view their team memberships"
ON public.team_members
FOR SELECT
USING (
  (user_id = auth.uid()) OR public.is_current_user_in_team(team_id)
);
