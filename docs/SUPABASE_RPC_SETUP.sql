-- RPC function to get the cheapest station nearby
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
      latest_prices.station_id,
      latest_prices.station_name,
      latest_prices.fuel_type,
      avg(latest_prices.price) as avg_price,
      avg(latest_prices.weighted_reputation) as avg_weight,
      latest_prices.dist_meters,
      case
        when extract(epoch from now() - max(latest_prices.created_at)) / 3600 < 24 then 'fresh'
        when extract(epoch from now() - max(latest_prices.created_at)) / 3600 < 72 then 'recent'
        else 'stale'
      end as freshness
    from latest_prices
    where latest_prices.rn = 1
    group by latest_prices.station_id, latest_prices.station_name, latest_prices.fuel_type, latest_prices.dist_meters
  )
  select
    aggregated.station_id,
    aggregated.station_name,
    aggregated.fuel_type,
    aggregated.avg_price,
    aggregated.dist_meters,
    least(100, greatest(10, round(aggregated.avg_weight * 4 + case when aggregated.freshness = 'fresh' then 15 when aggregated.freshness = 'recent' then 6 else 0 end)::integer)) as trust_score,
    aggregated.freshness
  from aggregated
  order by aggregated.avg_price asc, aggregated.dist_meters asc
  limit 1;
end;
$$ language plpgsql stable;

-- RPC function to get nearby stations for map
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

-- RPC function to consume access
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

-- RPC function to grant access
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
