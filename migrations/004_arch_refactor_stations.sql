-- Migration 004: Architecture refactor - stations, indexes, views, RPCs
-- Safe to run multiple times

-- ============================================
-- 1. ADD COLUMNS to stations
-- ============================================
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- 2. INDEXES
-- ============================================

-- GIST index on location for efficient PostGIS spatial queries
CREATE INDEX IF NOT EXISTS idx_stations_location
ON public.stations
USING GIST(location);

-- Composite index for fuel_prices: station + fuel type sorted by recency
CREATE INDEX IF NOT EXISTS idx_fuel_prices_station_type_created
ON public.fuel_prices(station_id, fuel_type, created_at DESC);

-- Drop redundant btree index on place_id (UNIQUE constraint already creates one)
DROP INDEX IF EXISTS idx_stations_place_id;

-- ============================================
-- 3. VIEW: current_fuel_prices
-- ============================================
CREATE OR REPLACE VIEW public.current_fuel_prices AS
SELECT DISTINCT ON (fp.station_id, fp.fuel_type)
  fp.station_id,
  fp.fuel_type,
  fp.price,
  fp.created_at
FROM public.fuel_prices fp
ORDER BY fp.station_id, fp.fuel_type, fp.created_at DESC;

-- ============================================
-- 4. RPC: get_nearby_stations (rewritten with radius_meters + limit + brand/city/province)
-- ============================================
DROP FUNCTION IF EXISTS public.get_nearby_stations(double precision, double precision);

CREATE OR REPLACE FUNCTION public.get_nearby_stations(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 10000,
  limit_count integer DEFAULT 50
)
RETURNS TABLE(
  station_id uuid,
  station_name text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  price numeric,
  fuel_type text,
  freshness text,
  trust_score integer,
  brand text,
  city text,
  province text
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
begin
  return query
  with nearby as (
    select
      s.id,
      s.name,
      s.latitude,
      s.longitude,
      s.brand,
      s.city,
      s.province,
      st_distance(s.location, st_point(user_lng, user_lat)::geography)::double precision as dist
    from stations s
    where s.is_active = true
      and st_distance(s.location, st_point(user_lng, user_lat)::geography) < radius_meters
    order by dist
    limit limit_count
  ),
  latest_prices as (
    select distinct on (n.id, cpf.fuel_type)
      n.id,
      cpf.fuel_type,
      cpf.price,
      cpf.created_at,
      fp.created_by
    from nearby n
    join current_fuel_prices cpf on cpf.station_id = n.id
    left join fuel_prices fp on fp.station_id = cpf.station_id and fp.fuel_type = cpf.fuel_type and fp.created_at = cpf.created_at
  ),
  station_trust as (
    select
      lp.id,
      avg(u.reputation)::double precision as avg_rep
    from latest_prices lp
    join users u on u.id = lp.created_by
    group by lp.id
  )
  select
    n.id,
    n.name,
    n.latitude,
    n.longitude,
    n.dist,
    lp.price,
    lp.fuel_type,
    case
      when extract(epoch from now() - lp.created_at) / 3600 < 24 then 'fresh'
      when extract(epoch from now() - lp.created_at) / 3600 < 72 then 'recent'
      else 'stale'
    end::text,
    least(100, greatest(10, round(
      coalesce(st.avg_rep, 0) * 4 +
      case
        when extract(epoch from now() - lp.created_at) / 3600 < 24 then 15
        when extract(epoch from now() - lp.created_at) / 3600 < 72 then 6
        else 0
      end
    )::integer)),
    n.brand,
    n.city,
    n.province
  from nearby n
  left join latest_prices lp on lp.id = n.id
  left join station_trust st on st.id = n.id
  order by n.dist, lp.fuel_type;
end;
$$;

-- ============================================
-- 5. RPC: ensure_station (remove gas_stations ref, add new columns)
-- ============================================
DROP FUNCTION IF EXISTS public.ensure_station(text, text, double precision, double precision, text);

CREATE OR REPLACE FUNCTION public.ensure_station(
  p_place_id TEXT,
  p_name TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_address TEXT DEFAULT NULL,
  p_brand TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  brand TEXT,
  city TEXT,
  province TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT s.id INTO v_id FROM stations s WHERE s.place_id = p_place_id;

  IF NOT FOUND THEN
    INSERT INTO stations (name, latitude, longitude, address, place_id, brand, city, province)
    VALUES (p_name, p_latitude, p_longitude, p_address, p_place_id, p_brand, p_city, p_province)
    RETURNING id INTO v_id;
  END IF;

  RETURN QUERY
  SELECT s.id, s.name, s.latitude, s.longitude, s.brand, s.city, s.province
  FROM stations s
  WHERE s.id = v_id;
END;
$$;
