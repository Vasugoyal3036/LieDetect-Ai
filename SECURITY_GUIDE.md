# Security Best Practices for Public Deployment

## 🔐 1. Protect Your Credentials

### ❌ NEVER Do This:
```javascript
// DON'T commit to GitHub
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_real_password
MONGO_URI=mongodb+srv://user:pass@...
```

### ✅ DO This:
1. Keep `.env` in `.gitignore` (check below)
2. Use `.env.example` with placeholder values
3. Set real values only in **Vercel Environment Variables**
4. Never share your `.env` file with anyone

### Check .gitignore

```bash
cat server/.gitignore
```

Should contain:
```
.env
.env.local
.env.*.local
node_modules/
dist/
uploads/
```

## 🛡️ 2. Rate Limiting (Spam Prevention)

Your app now has these limits:

| Action | Limit | Time Window |
|--------|-------|-------------|
| **Signup** | 5 attempts | 1 hour per IP |
| **Login** | 10 attempts | 15 minutes per IP |
| **Password Reset** | 3 attempts | 1 hour per IP |
| **2FA Verify** | 10 attempts | 15 minutes per IP |

**Example:** Someone can only create 5 accounts max from the same IP address per hour.

## 📧 3. Email Security

### Why App Password?
- Regular Gmail passwords don't work with third-party apps
- App Password is more secure and can be revoked anytime
- Won't compromise your actual Gmail account

### If Credentials Are Leaked:
1. Go to https://myaccount.google.com/apppasswords
2. Find the LieDetect AI app password
3. Delete it
4. Generate a new one
5. Update Vercel environment variables
6. That's it - your Gmail account is still safe

## 🚨 4. Other Security Measures

### Input Validation ✓
- Email format validated
- Password length enforced (min 6 chars)
- Name field required

### Password Security ✓
- Passwords hashed with bcryptjs (10 rounds)
- Never stored in plain text
- Never sent back in responses

### Database Security
- MongoDB connection uses credentials: `mongodb+srv://user:pass@...`
- Consider:
  - Using MongoDB IP whitelisting
  - Strong database passwords
  - Regular backups

### JWT Tokens
- Tokens expire after 2 hours
- Tokens only sent to verified users
- Stored only in localStorage on client

## ⚠️ 5. Common Vulnerabilities to Watch For

| Issue | Status | What to Do |
|-------|--------|-----------|
| SQL Injection | ✓ Protected | Using MongoDB (no SQL) |
| XSS (Cross-Site Scripting) | ⚠️ Partial | Sanitize user input more strictly |
| CSRF | ✓ Protected | Using JWT tokens |
| Brute Force | ✓ Protected | Rate limiting in place |
| Credential Stuffing | ⚠️ Monitor | Enable 2FA for users |
| DDoS | ⚠️ Monitor | Vercel has built-in DDoS protection |

## 🔍 6. Monitoring & Maintenance

### Regular Tasks:
- [ ] Monitor error logs in Vercel
- [ ] Check for failed login attempts
- [ ] Review MongoDB for suspicious activity
- [ ] Keep dependencies updated

### Update Dependencies:
```bash
cd server
npm outdated
npm update
```

## 📋 7. User Data Protection (GDPR/Privacy)

Consider adding:
- Privacy Policy page
- Terms of Service
- Data deletion endpoint
- Email unsubscribe option
- Clear data retention policy

## ✅ Deployment Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has placeholder values
- [ ] Vercel has all environment variables set
- [ ] Gmail App Password is used (not regular password)
- [ ] NODE_ENV=production on Vercel
- [ ] CLIENT_URL matches your Vercel frontend domain
- [ ] JWT_SECRET is a strong, random string (20+ chars)
- [ ] Rate limiting is active
- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] CORS allows only your domain

## 🚀 Production Environment Variables

```env
# Production-only settings
NODE_ENV=production

# NEVER use localhost in production
CLIENT_URL=https://your-frontend-domain.vercel.app

# Strong random secrets (generate at https://random.org)
JWT_SECRET=your_random_32_character_string_here

# Real MongoDB credentials (consider MongoDB Atlas)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/liedetector

# Real email credentials
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  (App Password from Google)

# Real API keys (never development keys)
GEMINI_API_KEY=your_production_key
GOOGLE_CLIENT_ID=your_production_client_id
RAZORPAY_KEY_ID=your_production_key

# Optional but recommended
DEBUG=false
LOG_LEVEL=error
```

## 🆘 If Something Gets Compromised

### Leaked Email Credentials:
1. Delete app password from Google
2. Generate new one
3. Update Vercel variables
4. Redeploy

### Leaked JWT_SECRET:
1. Generate a new strong secret
2. Update Vercel environment variables
3. Redeploy
4. All old tokens become invalid (users must log in again)

### Leaked MongoDB URI:
1. Change MongoDB password
2. Update MONGO_URI on Vercel
3. Redeploy
4. Consider backing up data first

## 📞 Emergency Contacts

- **Gmail Security:** https://myaccount.google.com/security
- **Vercel Security:** https://vercel.com/security
- **MongoDB Security:** https://docs.mongodb.com/manual/security/

---

**Remember:** Security is ongoing process, not a one-time setup!
