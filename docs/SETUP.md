# VIA Setup Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier works)

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to initialize
4. Navigate to the SQL Editor
5. Enable PostGIS extension:
   ```sql
   create extension if not exists postgis;
   ```

### 2. Set Up Database Schema

In Supabase SQL Editor, run the entire content from `docs/SUPABASE_RPC_SETUP.sql`:

```bash
# Copy the file content and paste into Supabase SQL Editor
cat docs/SUPABASE_RPC_SETUP.sql
```

This creates:
- Tables: users, gas_stations, fuel_prices, reports, access_logs, reputation_events
- Indexes on gas_stations location (GiST)
- RPC functions: get_cheapest_station, get_nearby_stations, consume_access, grant_access

### 3. Configure Google OAuth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project named "VIA"
   - Enable the Google+ API
   - Create OAuth 2.0 credentials (OAuth client ID for Android/iOS)
   - Add Redirect URIs:
     - `via://auth` (mobile)
     - `http://localhost:8081` (web dev)
     - Your production deep link

### 4. Environment Setup

```bash
# Clone/create the project
cd via

# Copy environment template
cp .env.example .env

# Edit .env and add your Supabase credentials:
# EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Get these from Supabase:
- Project Settings → API
- Copy URL (SUPABASE_URL)
- Copy anon public key (SUPABASE_ANON_KEY)

### 5. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Expo & React Native
- Supabase client
- Navigation (React Navigation)
- Maps (react-native-maps)
- OCR (ML Kit text recognition)
- State management (Zustand)
- Storage (AsyncStorage)

### 6. Run Development Server

```bash
npm start
```

Then choose your platform:
- **Android**: Press `a` (requires Android Studio/Emulator)
- **iOS**: Press `i` (macOS only, requires Xcode)
- **Web**: Press `w` (easiest for testing)
- **Expo Go**: Scan QR code with Expo Go app

## Testing Checklist

### Authentication
- [ ] App loads and shows Auth screen
- [ ] Google sign-in button works
- [ ] After sign-in, redirected to Home screen
- [ ] Profile appears in profile screen

### Location & Permissions
- [ ] Grant location permission
- [ ] Location is acquired (verify via console logs)
- [ ] Home screen loads

### Home Screen
- [ ] Displays cheapest station (if data exists in DB)
- [ ] Shows name, price, distance, freshness
- [ ] Access counter shows remaining points
- [ ] "Price locked" message appears if 0 access

### Map Screen
- [ ] Map loads with current location
- [ ] Markers appear for nearby stations
- [ ] Map is interactive (can zoom/pan)

### Contribute Screen
- [ ] Can take photo with camera
- [ ] OCR attempts to extract prices
- [ ] Manual numeric steppers work (+/- buttons)
- [ ] Submit button works
- [ ] Access points restored after submission

### Profile Screen
- [ ] Shows display name
- [ ] Shows reputation score
- [ ] Shows access remaining
- [ ] Sign out button works

## Troubleshooting

### Build Issues

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js
```

**"EXPO_PUBLIC_SUPABASE_URL is not defined"**
- Verify .env file exists and has correct format
- Restart Expo dev server

**"Deprecated: uuid"**
- Expected warning, not blocking

### Runtime Issues

**"Location permission denied"**
- Grant permission when prompted
- On physical device, check system settings
- On emulator, enable location in settings

**"OCR returns empty prices"**
- Ensure good lighting on pump display
- Image must be clear and in focus
- Manual fallback will trigger after 2 retries

**"Map not showing markers"**
- Verify nearby stations in DB: 
  ```sql
  select count(*) from gas_stations;
  ```
- Check PostGIS is enabled:
  ```sql
  select postgis_version();
  ```

**"Cannot connect to Supabase"**
- Check internet connection
- Verify SUPABASE_URL is correct
- Check ANON_KEY is valid
- Verify RLS policies allow access

### Performance Issues

**Slow initial load**
- Check network latency to Supabase
- Verify PostGIS indexes are created:
  ```sql
  select * from pg_indexes where schemaname = 'public';
  ```

**OCR taking > 3 seconds**
- Image resolution may be too high
- Device CPU may be limited
- This is acceptable on slower phones

## Seed Data (Optional)

To test with real data:

```sql
-- Insert sample gas station
insert into gas_stations (name, location, provider) values
  ('Shell Station Downtown', st_point(-74.0060, 40.7128)::geography, 'OSM');

-- Insert sample fuel prices
-- (get the station_id from previous query)
insert into fuel_prices (station_id, fuel_type, price, created_by) values
  ('station-uuid-here', 'regular', 3.45, 'user-uuid-here'),
  ('station-uuid-here', 'premium', 3.95, 'user-uuid-here'),
  ('station-uuid-here', 'diesel', 3.89, 'user-uuid-here');
```

## Production Deployment

### Build APK for Android

```bash
npx eas build --platform android --release
```

### Build IPA for iOS

```bash
npx eas build --platform ios --release
```

(Requires Apple Developer account)

See [Expo EAS Build](https://docs.expo.dev/build/introduction/) docs for details.

## Support

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Supabase Docs**: https://supabase.com/docs
- **PostGIS Docs**: https://postgis.net/docs/

Happy building! 🚀
