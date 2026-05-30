-- Migration 003: Auth fixes
-- Ensures auth_id UNIQUE constraint, RPC for upsert profile
-- Safe to run multiple times

-- ============================================
-- 1. ENSURE auth_id IS UNIQUE
-- ============================================
-- The users table might have been created without this constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_id_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
  END IF;
END $$;

-- ============================================
-- 2. RPC: upsert_user_profile
--    Atomically insert or update a user profile by auth_id.
--    Used to prevent race conditions when multiple ensureUserProfile
--    calls happen concurrently.
-- ============================================
CREATE OR REPLACE FUNCTION upsert_user_profile(
  p_auth_id UUID,
  p_display_name TEXT,
  p_reputation INTEGER DEFAULT 0,
  p_access_remaining INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  display_name TEXT,
  reputation INTEGER,
  access_remaining INTEGER,
  preferred_fuel TEXT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (auth_id, display_name, reputation, access_remaining)
  VALUES (p_auth_id, p_display_name, p_reputation, p_access_remaining)
  ON CONFLICT (auth_id) DO UPDATE SET
    display_name = CASE
      WHEN p_display_name IS NOT NULL AND p_display_name != '' THEN p_display_name
      ELSE users.display_name
    END
  RETURNING users.id, users.auth_id, users.display_name, users.reputation,
            users.access_remaining, users.preferred_fuel, users.created_at;
END;
$$;
