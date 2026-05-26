# Supabase URL Configuration for Mobile OAuth

## The Issue
If you changed Site URL to `via://auth`, that broke it. Site URL must be a real HTTPS URL.

## Correct Configuration

### In Supabase Dashboard → Settings → Authentication → URL Configuration

**Site URL:**
```
https://zyeynfmjzgmdomhlj.supabase.co
```
(Replace with your actual Supabase project URL - keep it as the default)

**Redirect URLs** (add as separate entries):
```
via://auth
https://zyeynfmjzgmdomhlj.supabase.co/auth/v1/callback
```

## What Each Does

- **Site URL**: Where Supabase redirects AFTER OAuth completes (must be HTTPS)
- **Redirect URLs**: Alternative endpoints that can receive the OAuth callback

## Why the Flow Works

1. User clicks "Sign in with Google"
2. `WebBrowser.openAuthSessionAsync()` opens Google OAuth
3. User authorizes → Google redirects to: `https://zyeynfmjzgmdomhlj.supabase.co/auth/v1/callback`
4. Supabase processes token and redirects to: `via://auth#access_token=...`
5. OS intercepts `via://` scheme → Opens your app
6. App gets the token from the URL hash
7. Session established ✅

## About the Browser View

The "webview" you're seeing (Android Chrome Custom Tab / iOS Safari View Controller) is **normal and expected**. 

- It's NOT a popup overlay
- It's the system browser opened by `WebBrowser`
- This is the recommended way for OAuth on mobile
- It's actually MORE secure than a popup (user can see the URL bar)

If you want something closer to a traditional popup, unfortunately `WebBrowser` is the best option for Expo on mobile.

## Quick Fix

1. Go to Supabase Dashboard
2. Settings → Authentication → URL Configuration
3. Set **Site URL** to: `https://zyeynfmjzgmdomhlj.supabase.co` (your project URL)
4. Set **Redirect URLs** to have both:
   - `via://auth`
   - `https://zyeynfmjzgmdomhlj.supabase.co/auth/v1/callback`
5. Click Save
6. Restart your app
7. Try login again
