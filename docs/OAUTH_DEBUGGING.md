# OAuth Debugging Guide

If the app is stuck on the login screen after Google OAuth, follow these debugging steps.

## Step 1: Check Browser Console (F12)

Open the browser developer tools and look for logs with prefix `[Auth]` or `[OAuth]`:

### Expected Successful Flow

```
[OAuth] Starting Google sign-in with redirectTo: http://localhost:8081
[OAuth] Opening auth session...
[OAuth] WebBrowser result type: success
[OAuth] Got success with URL
[OAuth] Found access token in hash
[OAuth] Session established successfully
[Auth] State changed: SIGNED_IN true
[Auth] Existing session found
```

### Common Failed Flows

**1. WebBrowser returns "dismiss":**
```
[OAuth] Starting Google sign-in...
[OAuth] WebBrowser result type: dismiss
[OAuth] User dismissed auth
```
→ User closed the auth window

**2. No token in hash:**
```
[OAuth] Got success with URL
[OAuth] No token in hash, checking getSession...
[OAuth] No session found in redirect
```
→ The token wasn't passed back to the app (configuration issue)

**3. Session not established:**
```
[OAuth] Found access token in hash
[OAuth] setSession failed: [error message]
```
→ Something wrong with the token or Supabase

## Step 2: Check Network Tab

1. Open **Network** tab in DevTools (F12)
2. Perform the Google login flow
3. Look for requests to:
   - `accounts.google.com/o/oauth2/auth` → Google auth page
   - `accounts.google.com/o/oauth2/token` → Token exchange (may not see this on web)
   - `*.supabase.co/auth/v1/authorize` → Supabase OAuth flow
   - `*.supabase.co/auth/v1/callback` → OAuth callback

### Check Responses
- Look for 200 status codes (success)
- If you see 400/401/403, there's a configuration error
- If you see CORS errors, the Site URL in Supabase might be wrong

## Step 3: Check Application Storage

1. Open **Application** tab in DevTools
2. Go to **Cookies** → look for cookies starting with `sb-`
3. Look for:
   - `sb-<project>-auth-token` → Your access token
   - `sb-<project>-auth-token-code-verifier` → PKCE verifier
   - `sb-<project>-auth-token-redirect-url` → Where to redirect

If these don't appear after login, the OAuth callback never executed.

## Step 4: Check the URL

After completing Google auth, check the URL in the address bar:

### Good URL
```
http://localhost:8081/#access_token=eyJhbGc...&refresh_token=...&expires_at=...
```
→ Token is in the hash, should work

### Bad URL
```
http://localhost:8081/
http://localhost:8081/?error=redirect_uri_mismatch
http://localhost:8081/?error=invalid_client
```
→ OAuth didn't complete properly

## Step 5: Manual Testing

If you want to manually test without the UI:

1. Open browser console (F12)
2. Paste:

```javascript
const { data } = await supabase.auth.getSession();
console.log('Current session:', data.session ? 'LOGGED IN' : 'NOT LOGGED IN');
```

### Should Print:
```
Current session: LOGGED IN
Object { ... user info ... }
```

If you get `NOT LOGGED IN`, the session wasn't saved properly.

## Step 6: Environment Variable Check

Run this in the app (add to a debug screen):

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...' || 'NOT SET');
```

If these show `NOT SET`, your `.env.local` isn't being read.

## Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Redirect URI mismatch** | `redirect_uri_mismatch` error in console or blank page | Verify `http://localhost:8081` is in Google Cloud Console authorized redirects |
| **Client ID/Secret wrong** | `invalid_client` error | Copy from Google Cloud Console again to Supabase |
| **Site URL not set** | CORS errors, blank page, redirect to wrong domain | Set Supabase Site URL to `http://localhost:8081` |
| **OAuth Consent Screen missing** | `access_denied`, `permission_denied` | Create OAuth Consent Screen first, add test user |
| **Token not being used** | App stays on login after successful redirect | Check if `onAuthStateChange` listener is running (should see `[Auth] State changed:` log) |
| **Session storage issue** | Token in URL but app doesn't persist session | Check browser cookies, may be disabled or third-party blocked |

## Advanced Debugging

### Enable Verbose Logging

Add this to your app temporarily:

```javascript
// In App.tsx or your bootstrap function
if (typeof window !== 'undefined') {
  window.DEBUG_OAUTH = true;
}

// In userStore.ts signInWithGoogle:
if (window.DEBUG_OAUTH) {
  console.log('[DEBUG] Full result object:', result);
  console.log('[DEBUG] Result URL:', result.url);
}
```

### Test with Mock Mode

Set `EXPO_PUBLIC_SUPABASE_URL` to an invalid value temporarily:

```env
EXPO_PUBLIC_SUPABASE_URL=https://invalid.supabase.co
```

This forces the app into mock mode (you'll get a test user without OAuth).
This helps verify the rest of the app works.

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Select your project
3. Go to **Auth** → **Auth Events**
4. Filter by your email
5. Look for:
   - `OAUTH_SIGNIN` → OAuth login started
   - `TOKEN_REFRESH` → Token was refreshed
   - `USER_SIGNUP` → New user created
   - `USER_SIGNEDIN` → User logged in
   - Any errors with red X icon

## Still Stuck?

If none of these help:

1. **Clear everything:**
   - Clear browser cookies/cache (Ctrl+Shift+Delete)
   - Restart dev server
   - Hard reload page (Ctrl+Shift+R or Cmd+Shift+R)

2. **Check Supabase status:**
   - Go to https://status.supabase.com
   - Make sure Auth service is green

3. **Verify configuration once more:**
   - Google Cloud Console: Client ID and Secret
   - Supabase: Settings → Authentication → URL Configuration
   - `.env.local`: Correct URL and Key
   - Dev server: Restarted after env changes

4. **Create a fresh test:**
   - Use incognito/private browser window
   - Try with a different Google account
   - Test on a different device if possible
