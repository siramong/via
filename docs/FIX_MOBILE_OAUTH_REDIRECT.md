# Fix OAuth Redirect URI for Mobile

## Problem
After Google OAuth completes, the app redirects to `localhost:3000` instead of returning to the app with `via://auth` scheme.

## Solution

### Step 1: Update Supabase Redirect URIs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Authentication** → **URL Configuration**
4. In **Redirect URLs** section, ensure you have:
   ```
   via://auth
   ```

5. If you see `http://localhost:3000`, **REMOVE IT** and replace with `via://auth`
6. Click **Save**

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **Credentials** → Your OAuth 2.0 Client
3. Click **Edit** 
4. In **Authorized redirect URIs**, ensure you have:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
   (example: `https://zyeynfmjzgmdomhlj.supabase.co/auth/v1/callback`)

5. **Remove any `localhost` URIs** (these are for web only)
6. Click **Save**

### Step 3: Verify App Configuration

Your `app.json` already has:
```json
"scheme": "via"
```

This means Expo will register the `via://` deep link scheme with the OS.

### Step 4: Test

1. Restart your app/dev server
2. Try Google login again
3. After Google auth completes, you should stay in the app with a token

## Reference

- **Mobile Redirect**: `via://auth` (Expo custom scheme)
- **OAuth Callback**: `https://<project>.supabase.co/auth/v1/callback` (for Google)

The flow:
1. App → Clicks "Sign in with Google"
2. Opens Google OAuth in browser
3. Google redirects to Supabase callback: `https://<project>.supabase.co/auth/v1/callback`
4. Supabase processes token and redirects to: `via://auth#access_token=...`
5. OS intercepts `via://` scheme and opens the app with the token in the URL
6. `WebBrowser.maybeCompleteAuthSession()` captures the token
7. App establishes session ✅
