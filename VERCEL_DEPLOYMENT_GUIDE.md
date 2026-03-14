# LieDetect AI - Vercel Deployment Guide

## Problem: Signup Failing on Vercel

The signup flow was failing because environment variables weren't properly configured for production.

## Solution: Configure Environment Variables on Vercel

### For Backend Server

If deploying the backend to Vercel, add these environment variables in your Vercel project settings:

**Dashboard → Settings → Environment Variables**

```
PORT=5001
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_key
CLIENT_URL=https://your-frontend-domain.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
GEMINI_API_KEY=your_gemini_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**⚠️ IMPORTANT:** Replace `your-frontend-domain.vercel.app` with your actual Vercel frontend URL.

### For Frontend Client

In your Vercel project settings, add:

```
VITE_API_URL=https://your-backend-api-url/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

**For VITE_API_URL, use one of:**
- If backend is on Vercel: `https://your-backend-vercel-url.vercel.app/api`
- If backend is on another server: Use that server's URL
- If backend is on localhost during development: `http://localhost:5001/api`

## Email Configuration Setup

Gmail no longer allows regular passwords for app access. Follow these steps:

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Generate a new app password
4. Use this 16-character password as `EMAIL_PASS`

Example:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  (note the spaces - this is typically optional)
```

## Common Issues and Fixes

### "Signup failed. Please try again." (No specific error)

**Cause:** The signup form submitted but the backend returned a generic error.

**Check:**
1. Open browser DevTools (F12) → Network tab
2. Fill signup form and submit
3. Look for API request to `/auth/signup`
4. Click on it and check the Response tab
5. Note the actual error message

**Solutions:**
- If 500 error with email service error: Check EMAIL_USER and EMAIL_PASS
- If 400 error "User already exists": Try different email
- If CORS error: Check CLIENT_URL is correctly set in backend
- If timeout: Email service might be slow, wait 30 seconds and try again

### Email Not Received

1. Check spam/junk folder
2. Verify EMAIL_PASS is correct (not regular Gmail password)
3. Check that "Less secure app access" is NOT needed (Gmail removed this option)
4. Try resending verification email from the page

### CORS Errors (Origins not allowed)

**Cause:** CLIENT_URL doesn't match your frontend URL

**Fix:** Update CLIENT_URL in server environment variables to match your Vercel frontend domain.

## Deployment Steps

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Fix signup with improved error handling"
git push
```

### Step 2: Configure Vercel Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all required variables listed above

### Step 3: Redeploy
1. Go to Deployments tab
2. Click the three dots on latest deployment
3. Click "Redeploy"

### Step 4: Test Signup
1. Try signup with new email
2. Check inbox for verification email
3. Check browser console (F12) for any errors

## Database Considerations

Make sure your MongoDB connection string:
- Is a cluster with internet access enabled
- Has your IP address whitelisted (or 0.0.0.0 for all IPs)
- Contains correct username and password

## Next Steps

After fixing signup, ensure these are also working:
- [ ] Email verification (click link in email)
- [ ] Login with email/password
- [ ] Google Sign-In
- [ ] Password reset flow

## Support

If issues persist:
1. Check server logs in Vercel: Deployments → [latest] → Logs
2. Check function logs for backend
3. Open browser console for client-side errors
4. Verify all environment variables are set
