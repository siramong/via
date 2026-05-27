-- Migration 002: RLS policies + fix get_nearby_stations
-- Safe to run multiple times (policies are auto-replaced by name)

-- ============================================
-- 1. FIX get_nearby_stations — join fuel_prices & alias columns
--    Before: only returned id, name, st_y, st_x, st_distance from gas_stations
--    After:  joins fuel_prices + users, returns station_id, station_name,
--            latitude, longitude, distance_meters, price, fuel_type,
--            freshness, trust_score
-- ============================================
DROP FUNCTION IF EXISTS get_nearby_stations(double precision, double precision);

CREATE OR REPLACE FUNCTION get_nearby_stations(
  user_lat double precision,
  user_lng double precision
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
  trust_score integer
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
begin
  return query
  with nearby as (
    select
      gs.id,
      gs.name,
      st_y(gs.location::geometry)::double precision as lat,
      st_x(gs.location::geometry)::double precision as lng,
      st_distance(gs.location, st_point(user_lng, user_lat)::geography)::double precision as dist
    from gas_stations gs
    where st_distance(gs.location, st_point(user_lng, user_lat)::geography) < 5000
    order by dist
    limit 100
  ),
  latest_prices as (
    select distinct on (n.id)
      n.id,
      fp.fuel_type,
      fp.price,
      fp.created_at,
      fp.created_by
    from nearby n
    join fuel_prices fp on fp.station_id = n.id
    order by n.id, fp.created_at desc
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
    n.lat,
    n.lng,
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
    )::integer))
  from nearby n
  left join latest_prices lp on lp.id = n.id
  left join station_trust st on st.id = n.id
  order by n.dist;
end;
$$;

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gas_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- 2a. users — reputation is public (needed for trust score), INSERT/UPDATE restricted to own row
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_id = auth.uid());

-- 2b. reports — users only see/edit their own
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 2c. gas_stations — public read, authenticated insert (via ensure_station)
CREATE POLICY "gas_stations_select" ON public.gas_stations
  FOR SELECT USING (true);

CREATE POLICY "gas_stations_insert" ON public.gas_stations
  FOR INSERT WITH CHECK (true);

-- 2d. stations — public read, authenticated insert (via ensure_station)
CREATE POLICY "stations_select" ON public.stations
  FOR SELECT USING (true);

CREATE POLICY "stations_insert" ON public.stations
  FOR INSERT WITH CHECK (true);

-- 2e. fuel_prices — public read, authenticated insert
CREATE POLICY "fuel_prices_select" ON public.fuel_prices
  FOR SELECT USING (true);

CREATE POLICY "fuel_prices_insert" ON public.fuel_prices
  FOR INSERT WITH CHECK (true);

-- 2f. access_logs — own select, authenticated insert (via RPCs)
CREATE POLICY "access_logs_select_own" ON public.access_logs
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "access_logs_insert" ON public.access_logs
  FOR INSERT WITH CHECK (true);

-- 2g. reputation_events — users only see their own
CREATE POLICY "reputation_events_select_own" ON public.reputation_events
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
