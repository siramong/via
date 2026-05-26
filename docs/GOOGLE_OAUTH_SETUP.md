# Google OAuth Configuration for VIA App

## Problem
OAuth login flow gets stuck on the login screen after user authorizes Google login. This is typically due to incorrect redirect URI configuration.

## Root Causes
1. **Redirect URI mismatch** between Google Cloud Console and Supabase
2. **Site URL not configured** in Supabase
3. **OAuth Consent Screen** not set up
4. **Scopes** not properly configured

## Step-by-Step Setup

### 1. Google Cloud Project Setup

#### 1.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Search for "Google+ API" and enable it
4. Go to **Credentials** (left sidebar)
5. Click **+ Create Credentials** → **OAuth 2.0 Client ID**

#### 1.2 Configure OAuth Consent Screen
**⚠️ IMPORTANT: Do this BEFORE creating credentials**

1. Go to **Credentials** → **OAuth 2.0 Consent Screen**
2. Select **External** (for now, since app is in development)
3. Fill in:
   - **App name**: `VIA`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. On **Scopes** page: Add `openid`, `profile`, `email` (already pre-selected)
   - Click **Save and Continue**
6. On **Test users** page: Add your test email (the one doing OAuth)
   - Click **Save and Continue**

#### 1.3 Create OAuth 2.0 Client ID

1. Go back to **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `VIA Web App`
5. **Authorized redirect URIs** - Add BOTH:
   ```
   http://localhost:8081
   http://localhost:8081/
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
   (Replace `<your-supabase-project>` with your actual Supabase project ID)

6. Click **Create**
7. Copy the **Client ID** and **Client Secret** - you'll need these

### 2. Supabase Configuration

#### 2.1 Configure Site URL
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings** → **Authentication** → **URL Configuration**
4. Set **Site URL**:
   - For local dev: `http://localhost:8081`
   - For production: `https://yourdomain.com`

#### 2.2 Add Google OAuth Provider
1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google** and click it
3. Enable the provider
4. Paste your **Client ID** from Google Cloud Console
5. Paste your **Client Secret** from Google Cloud Console
6. Make sure the redirect URL shown matches: 
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
7. Click **Save**

#### 2.3 Update Supabase Redirect URIs
In Google Cloud Console, if you haven't already:
1. Go to **Credentials** → Your OAuth 2.0 Client
2. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```

### 3. Environment Variables

Create/update `.env.local` in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://zyeynfmjzgmdomhlj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the dev server after updating `.env.local`.

### 4. Testing the OAuth Flow

#### Local Web Testing
1. Start the dev server: `npx expo start --web`
2. Go to `http://localhost:8081`
3. Click "Sign in with Google"
4. You should see the Google consent screen
5. After authorizing, you should be redirected back to the app with a token in the URL hash

#### Debugging
If you get stuck on the login screen:

**In browser console (F12), check:**
1. **Network tab**: Look for requests to `https://...supabase.co/auth/v1/...`
2. **Application tab → Cookies**: Look for `sb-*-auth-token`
3. **Console tab**: Any error messages from the app

**Common errors:**
- `redirect_uri_mismatch` → Your redirect URIs don't match
- `invalid_client` → Client ID/Secret is wrong
- `access_denied` → User declined or test user not added
- CORS errors → Site URL not configured in Supabase

### 5. Troubleshooting

#### Error: "redirect_uri_mismatch"
- Check that `http://localhost:8081` is in Google Cloud Console authorized redirects
- Restart dev server after config changes
- Clear browser cache

#### Error: "invalid_client"
- Verify Client ID and Client Secret are correct in Supabase
- Check that Google provider is enabled in Supabase
- Regenerate credentials if unsure

#### Error: "access_denied"
- Add your test email to OAuth Consent Screen test users
- Wait a few minutes for Google config to propagate
- Try incognito/private browser window

#### Stuck on login screen (no error)
- Check browser Network tab for failed requests
- Verify Site URL in Supabase matches your dev URL
- Ensure `onAuthStateChange` is running (should see logs in console)
- Check that session is being set after redirect

### 6. Production Setup

When deploying to production:

1. Change OAuth Consent Screen from **External** to **Internal** (or **External** with verified domain)
2. Update all redirect URIs to use `https://yourdomain.com`
3. Update Supabase Site URL to `https://yourdomain.com`
4. Add production redirect URIs to Google Cloud Console
5. Test the full OAuth flow on production domain

## Reference URLs

- Google Cloud Console: https://console.cloud.google.com
- Supabase Dashboard: https://supabase.com/dashboard
- Google OAuth Scopes: https://developers.google.com/identity/protocols/oauth2/scopes
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/auth-google

## Quick Checklist

- [ ] Google+ API enabled
- [ ] OAuth Consent Screen configured
- [ ] Test user email added to consent screen
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID and Secret copied to Supabase
- [ ] `http://localhost:8081` in Google authorized redirects
- [ ] `https://<project>.supabase.co/auth/v1/callback` in Google authorized redirects
- [ ] Supabase Site URL set to `http://localhost:8081`
- [ ] `.env.local` updated with credentials
- [ ] Dev server restarted
- [ ] Browser cache cleared
