# Authentication Fix Guide

## Issue
Getting 401 "Invalid authentication credentials" when trying to create bookings/travelers.

## Root Cause
The JWT_SECRET is randomly generated on each server restart if not set in environment variables. This means:
- Tokens created before a restart become invalid
- Users need to login again after server restarts

## Solution

### Option 1: Set JWT_SECRET in Environment (Recommended)

Create a `.env` file in the project root:

```bash
JWT_SECRET=your-secret-key-here-make-it-long-and-random
JWT_EXPIRY_HOURS=24
```

**Generate a secure secret:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Option 2: Use a Fixed Secret in Code (Not Recommended for Production)

Edit `app/auth.py`:
```python
JWT_SECRET = os.getenv("JWT_SECRET", "your-fixed-secret-key-here")
```

## Testing Authentication

1. **Register/Login**:
   - Go to `/login`
   - Register a new account or login
   - Check browser console for "Auth state loaded from localStorage"

2. **Verify Token**:
   - Open browser DevTools → Application → Local Storage
   - Check that `auth_token` exists
   - Token should start with `eyJ...` (JWT format)

3. **Test API Call**:
   - Try creating a booking
   - Check browser console for "Creating booking with token: Token present"
   - Check network tab to see Authorization header

## Debug Steps

If still getting 401:

1. **Check Token in Browser**:
   ```javascript
   localStorage.getItem('auth_token')
   ```

2. **Check Token Format**:
   - Should be a JWT string (starts with `eyJ`)
   - Should not be null or empty

3. **Check Server Logs**:
   - Look for "Invalid token error" or "Token expired" messages
   - Check if JWT_SECRET is consistent

4. **Re-login**:
   - Logout and login again to get a fresh token
   - This ensures token was created with current JWT_SECRET

## Quick Fix

If you just restarted the server:
1. Logout from the frontend
2. Login again to get a new token
3. Try creating a booking again

