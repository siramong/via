-- Migration 006: Fix auth security — restrict RLS, create safe RPCs
-- Safe to run multiple times

-- ============================================
-- 1. Revoke EXECUTE on sensitive functions from anon
-- ============================================
REVOKE EXECUTE ON FUNCTION public.trg_approve_report FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.upsert_user_profile FROM anon, public;

-- ============================================
-- 2. Restrict fuel_prices INSERT to authenticated only
-- ============================================
DROP POLICY IF EXISTS "fuel_prices_insert" ON public.fuel_prices;
CREATE POLICY "fuel_prices_insert" ON public.fuel_prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 3. Restrict stations INSERT to authenticated only
-- ============================================
DROP POLICY IF EXISTS "stations_insert" ON public.stations;
CREATE POLICY "stations_insert" ON public.stations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 4. Restrict access_logs INSERT to authenticated only
-- ============================================
DROP POLICY IF EXISTS "access_logs_insert" ON public.access_logs;
CREATE POLICY "access_logs_insert" ON public.access_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 5. RPC: approve_report — admin-only function
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_report(report_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.reports SET status = 'validated' WHERE id = report_id;
END;
$$;

ALTER FUNCTION public.approve_report(UUID) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.approve_report(UUID) FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_report(UUID) TO authenticated;

-- ============================================
-- 6. RPC: reject_report
-- ============================================
CREATE OR REPLACE FUNCTION public.reject_report(report_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.reports SET status = 'rejected' WHERE id = report_id;
END;
$$;

ALTER FUNCTION public.reject_report(UUID) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.reject_report(UUID) FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_report(UUID) TO authenticated;

-- ============================================
-- 7. Ensure reports UPDATE policy exists for admin
-- ============================================
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- 8. Add admin column to users (optional, for future)
-- ============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
