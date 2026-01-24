# Quick Deployment Guide

The Edge Functions have been updated to fix the 401 authentication errors. You need to redeploy them.

## Quick Deploy

```bash
cd /home/adebayo/Desktop/New

# If you have Supabase CLI installed:
supabase functions deploy audit-staff-auth
supabase functions deploy create-staff-auth

# Or use the script:
./deploy-staff-auth-functions.sh
```

## What Was Fixed

The functions were returning "401 Invalid JWT" because they needed proper user authentication. Now they:
- ✅ Verify your admin user token
- ✅ Check you have admin role
- ✅ Use service role only for creating auth accounts

After redeploying, the buttons will work!
