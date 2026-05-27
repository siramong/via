-- Migration: Create stations table and integration functions
-- Safe to run multiple times (IF NOT EXISTS)

-- ============================================
-- 1. STATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  place_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns in case table already existed without them
ALTER TABLE stations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS place_id TEXT;

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stations_place_id ON stations (place_id);
CREATE INDEX IF NOT EXISTS idx_stations_coords ON stations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stations_name ON stations (name);

-- ============================================
-- 3. ENSURE STATION FUNCTION
-- ============================================
-- Upserts a station by place_id into both `stations` and `gas_stations`
-- (same UUID) so that FK from reports.station_id → gas_stations(id) works.
CREATE OR REPLACE FUNCTION ensure_station(
  p_place_id TEXT,
  p_name TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Look up existing station by place_id
  SELECT s.id INTO v_id FROM stations s WHERE s.place_id = p_place_id;

  IF NOT FOUND THEN
    -- Insert into stations first, capture the new UUID
    INSERT INTO stations (name, latitude, longitude, address, place_id)
    VALUES (p_name, p_latitude, p_longitude, p_address, p_place_id)
    RETURNING id INTO v_id;

    -- Sync to gas_stations (same UUID) so existing FKs work
    INSERT INTO gas_stations (id, name, location, provider)
    VALUES (
      v_id,
      p_name,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      'OSM'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.latitude, s.longitude
  FROM stations s
  WHERE s.id = v_id;
END;
$$;
