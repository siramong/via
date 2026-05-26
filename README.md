# VIA — Cheapest Fuel in Real Time

A React Native mobile app (Expo) that shows the cheapest nearby fuel station in real-time through community-validated fuel price reports.

## Tech Stack

- **Frontend:** React Native (Expo SDK 56) + TypeScript
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Auth:** Supabase Google OAuth
- **Maps:** OpenStreetMap + react-native-maps
- **OCR:** Google ML Kit (on-device)
- **State:** Zustand
- **Navigation:** React Navigation (bottom tabs)

## Project Structure

```
src/
├── screens/
│   ├── AuthScreen.tsx       # Google OAuth sign-in
│   ├── HomeScreen.tsx       # Cheapest station display
│   ├── ContributeScreen.tsx # Photo + OCR + price submit
│   ├── MapScreen.tsx        # Interactive map view
│   └── ProfileScreen.tsx    # User profile & settings
├── components/
│   ├── FuelCard.tsx         # Main result card
│   ├── AccessCounter.tsx    # Access points display
│   ├── PriceSelector.tsx    # Numeric stepper for prices
│   └── MapView.tsx          # OSM map wrapper
├── services/
│   ├── supabase.ts          # Supabase client & auth setup
│   ├── location.ts          # GPS + permission handling
│   ├── ocr.ts               # ML Kit OCR with retry logic
│   └── pricing.ts           # RPC calls & data validation
├── state/
│   ├── userStore.ts         # Zustand auth + profile state
│   └── locationStore.ts     # Zustand geolocation state
├── theme.ts                 # Colors, spacing, radius
└── types.ts                 # TypeScript interfaces

docs/
└── SUPABASE_RPC_SETUP.sql   # SQL functions to deploy
```

## Quick Start

### 1. Setup Environment

```bash
# Copy .env template
cp .env.example .env

# Fill in your Supabase credentials
# EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Create a new Supabase project
2. Enable PostGIS extension in SQL editor
3. Run all SQL from `docs/SUPABASE_RPC_SETUP.sql` (schema + RPCs)
4. Create the tables from the schema section below
5. Enable Google OAuth in Supabase Auth settings
6. Configure redirect URL: `via://auth`

### 4. Run on Development Server

```bash
npm start
```

- Android: `a`
- iOS: `i` (macOS only) or use Expo Go
- Web: `w`

## Supabase Database Schema

Run this in the Supabase SQL editor:

```sql
create extension if not exists postgis;

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique not null,
  display_name text,
  reputation integer default 0,
  access_remaining integer default 3,
  created_at timestamp default now()
);

create table gas_stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location geography(point, 4326) not null,
  provider text default 'OSM'
);

create index gas_stations_location_idx
on gas_stations using gist(location);

create table fuel_prices (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references gas_stations(id),
  fuel_type text check (fuel_type in ('regular','premium','diesel')),
  price numeric not null,
  created_by uuid references users(id),
  reputation_weight integer default 0,
  created_at timestamp default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  station_id uuid references gas_stations(id),
  image_url text not null,
  ocr_json jsonb,
  status text check (status in ('pending','validated','rejected')) default 'pending',
  created_at timestamp default now()
);

create table access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text,
  created_at timestamp default now()
);

create table reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  delta integer not null,
  reason text,
  created_at timestamp default now()
);
```

Then deploy all RPC functions from `docs/SUPABASE_RPC_SETUP.sql`.

## Core Features

### Access Economy

- Users start with **3 free queries**
- Each full query consumes 1 access point
- At 0 access, only the station name & distance visible (price locked)
- **Restore access by contributing:**
  - Valid report: +2 access
  - Correction validated by community: +1 access

### Contribution Flow

1. Tap **Contribute** tab
2. Capture pump display photo
3. ML Kit OCR extracts prices (automatic retry up to 2x if confidence < 60%)
4. Manual numeric stepper fallback if OCR fails
5. Submit report → image to storage, data to DB
6. Earn +2 access points immediately

### Pricing Logic

**Cheapest Station Selection:**
- Fetch all stations within 5 km
- For each, compute weighted median of latest fuel prices
- Weight = user reputation + recency bonus
- Freshness: < 24h = fresh, < 72h = recent, > 72h = stale
- Trust score (1–100) based on weight + freshness

**Reputation System:**
- Valid report accepted: +10
- Report confirmed correct: +5
- Rejected report: -10

### Map View

- Background map (subtle pulse animation)
- Markers for all nearby stations
- Tapping markers shows basic info
- User location centered

## Permissions Required

- **Location (GPS):** Used on Home Screen to query cheapest
- **Camera:** Used in Contribute Screen for photo capture
- **Photo Library:** Used in Contribute Screen for fallback selection

## Performance Targets

- Initial load: < 2 seconds
- Query response: < 500ms
- OCR processing: < 3 seconds average

## UI Design System

| Aspect | Value |
|--------|-------|
| Primary | `#1E2A78` |
| Success | `#19D36B` |
| Warning | `#FFC400` |
| Danger | `#FF4D4D` |
| Background | `#0B0F1A` |
| Card BG | `#141A2B` |

**Rules:**
- 1 primary action per screen max
- Card-based layout
- Animations: 200–300ms
- Map always in background (subtle)

## Non-Negotiable Rules

✅ No external paid APIs  
✅ No blockchain  
✅ No anonymous users (Google OAuth only)  
✅ No free text input for prices (only numeric steppers)  
✅ No multi-result home screen clutter  
✅ PostGIS for all geospatial queries  
✅ ML Kit (on-device) for OCR  

## Success Criteria

- User finds cheapest fuel in < 5 seconds
- Contribution flow completes in < 30 seconds
- Data updates daily via community
- > 50% users contribute at least once

## Deployment

### Development
```bash
npm start
```

### Build for Production
```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web
npm run web
```

For native builds, use EAS Build:
```bash
npx eas build --platform android
npx eas build --platform ios
```

See [Expo docs](https://docs.expo.dev) for full build configuration.

## Troubleshooting

**Supabase RPC returns null?**
- Check the RPC function syntax in SQL editor
- Verify `PostGIS` extension is enabled
- Ensure user has location data

**OCR not working?**
- Check camera permissions granted
- Verify image clarity (well-lit pump display)
- Try manual entry if OCR confidence too low

**Map markers not showing?**
- Confirm nearby stations exist in DB
- Check location permission granted
- Verify coordinates are valid (should be geography type)

## Future Features (Out of Scope for MVP)

- Business claims & verified station profiles
- Leaderboards (reputation-ranked users)
- Price history & trends
- Multi-language support
- Offline caching
- Push notifications for price drops
