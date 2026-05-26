-- VIA Database Complete Setup
-- Run this entire script in Supabase SQL Editor

create extension if not exists postgis;

-- USERS TABLE
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null,
  display_name text,
  reputation integer default 0,
  access_remaining integer default 3,
  created_at timestamp default now()
);

-- GAS STATIONS TABLE
create table gas_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location geography(point, 4326) not null,
  provider text default 'OSM'
);

create index gas_stations_location_idx
on gas_stations using gist(location);

-- FUEL PRICES TABLE
create table fuel_prices (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references gas_stations(id),
  fuel_type text check (fuel_type in ('regular','premium','diesel')),
  price numeric not null,
  created_by uuid references users(id),
  reputation_weight integer default 0,
  created_at timestamp default now()
);

-- REPORTS TABLE
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  station_id uuid references gas_stations(id),
  image_url text not null,
  ocr_json jsonb,
  status text check (status in ('pending','validated','rejected')) default 'pending',
  created_at timestamp default now()
);

-- ACCESS LOGS TABLE
create table access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text,
  created_at timestamp default now()
);

-- REPUTATION EVENTS TABLE
create table reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  delta integer not null,
  reason text,
  created_at timestamp default now()
);

-- DISABLE RLS FOR MVP (enable later in production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE gas_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_events DISABLE ROW LEVEL SECURITY;

-- RPC: Get cheapest station nearby
create or replace function get_cheapest_station(
  user_lat float,
  user_lng float
)
returns table (
  station_id uuid,
  station_name text,
  fuel_type text,
  price numeric,
  distance_meters float,
  trust_score integer,
  freshness text
) as $$
begin
  return query
  with nearby_stations as (
    select
      gs.id,
      gs.name,
      st_distance(gs.location, st_point(user_lng, user_lat)::geography) as dist_meters
    from gas_stations gs
    where st_distance(gs.location, st_point(user_lng, user_lat)::geography) < 5000
    order by dist_meters
    limit 50
  ),
  latest_prices as (
    select
      ns.id as station_id,
      ns.name as station_name,
      fp.fuel_type,
      fp.price,
      fp.created_at,
      (u.reputation + case
        when extract(epoch from now() - fp.created_at) / 3600 < 24 then 5
        when extract(epoch from now() - fp.created_at) / 3600 < 72 then 2
        else 0
      end) as weighted_reputation,
      ns.dist_meters,
      row_number() over (partition by ns.id, fp.fuel_type order by fp.created_at desc) as rn
    from nearby_stations ns
    join fuel_prices fp on fp.station_id = ns.id
    join users u on u.id = fp.created_by
  ),
  aggregated as (
    select
      lp.station_id,
      lp.station_name,
      lp.fuel_type,
      avg(lp.price) as avg_price,
      avg(lp.weighted_reputation) as avg_weight,
      lp.dist_meters,
      case
        when extract(epoch from now() - max(lp.created_at)) / 3600 < 24 then 'fresh'
        when extract(epoch from now() - max(lp.created_at)) / 3600 < 72 then 'recent'
        else 'stale'
      end as freshness
    from latest_prices lp
    where lp.rn = 1
    group by lp.station_id, lp.station_name, lp.fuel_type, lp.dist_meters
  )
  select
    agg.station_id,
    agg.station_name,
    agg.fuel_type,
    agg.avg_price,
    agg.dist_meters,
    least(100, greatest(10, round(agg.avg_weight * 4 + case when agg.freshness = 'fresh' then 15 when agg.freshness = 'recent' then 6 else 0 end)::integer)) as trust_score,
    agg.freshness
  from aggregated agg
  order by agg.avg_price asc, agg.dist_meters asc
  limit 1;
end;
$$ language plpgsql stable;

-- RPC: Get nearby stations for map
create or replace function get_nearby_stations(
  user_lat float,
  user_lng float
)
returns table (
  station_id uuid,
  station_name text,
  latitude float,
  longitude float,
  distance_meters float
) as $$
begin
  return query
  select
    gs.id,
    gs.name,
    st_y(gs.location::geometry)::float,
    st_x(gs.location::geometry)::float,
    st_distance(gs.location, st_point(user_lng, user_lat)::geography)::float
  from gas_stations gs
  where st_distance(gs.location, st_point(user_lng, user_lat)::geography) < 5000
  order by st_distance(gs.location, st_point(user_lng, user_lat)::geography)
  limit 100;
end;
$$ language plpgsql stable;

-- RPC: Consume access
create or replace function consume_access(user_auth_id uuid)
returns integer as $$
declare
  remaining integer;
begin
  update users
  set access_remaining = access_remaining - 1
  where auth_id = user_auth_id and access_remaining > 0;

  select access_remaining into remaining
  from users
  where auth_id = user_auth_id;

  insert into access_logs (user_id, action)
  select id, 'consume_access'
  from users
  where auth_id = user_auth_id;

  return coalesce(remaining, 0);
end;
$$ language plpgsql;

-- RPC: Grant access
create or replace function grant_access(
  user_auth_id uuid,
  access_delta integer,
  access_reason text
)
returns integer as $$
declare
  remaining integer;
begin
  update users
  set access_remaining = access_remaining + access_delta
  where auth_id = user_auth_id;

  select access_remaining into remaining
  from users
  where auth_id = user_auth_id;

  insert into access_logs (user_id, action)
  select id, 'grant_access: ' || access_reason
  from users
  where auth_id = user_auth_id;

  return coalesce(remaining, 0);
end;
$$ language plpgsql;
