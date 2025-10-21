# Production Cleanup Checklist

## ✅ Completed Actions

### 1. Removed Unused/Test API Routes
- ❌ **Deleted**: `/app/api/test-aircraft-lookup/` - Test endpoint for aircraft lookup
- ❌ **Deleted**: `/app/api/zoho-crm/` - Legacy direct CRM endpoint (replaced by `/api/submit-form`)
- ❌ **Deleted**: `/app/api/zoho-workdrive/` - Legacy WorkDrive endpoint (deprecated)

### 2. Cleaned Auth Module
- ✅ **lib/zoho/auth.ts** - Removed debug console.log statements
- ✅ Kept essential error logging with console.error

---

## 🔧 Recommended Manual Actions

### 1. Console Logging Cleanup

#### High Priority - Remove Debug Logs
**File: `lib/zoho/crm.ts`**
- Line 15-17: Remove payload logging in `createRecord()`
- Line 33: Remove response logging
- Line 78: Remove update payload logging  
- Line 94: Remove update response logging
- Line 141: Remove "OccurrenceId fetched" log
- Line 146: Remove retry attempt log
- Line 179: Remove "Validating member" log
- Line 194: Remove "Trying search criteria" log
- Line 214: Remove "Search criteria failed" log
- Line 223: Remove "Search response" log
- Line 233: Remove "Found member" log
- Lines 276-292: Remove verbose name comparison logging

**Keep these error logs:**
- Line 30: "Failed to create CRM record"
- Line 87: "Failed to update CRM record"
- Line 138: "Failed to fetch OccurrenceId"
- Line 145: "OccurrenceId not found after retries"
- Line 221: "Failed to validate member number"

**File: `lib/zoho/workdrive.ts`**
- Line 62: Remove "Failed to validate folder" log (keep in catch)
- Line 124: Remove "Failed to search for child folder" log
- Line 162: Remove "Created folder" log
- Line 192: Remove "Created folder" log
- Line 229: Remove "Found existing folder" log
- Line 300: Remove "Uploaded file" log

**File: `app/api/aircraft-lookup/route.ts`**
- Lines 41, 68, 87, 89, 99, 123-124, 129-130, 189-192: Remove all console.log statements
- Keep console.error for actual errors

**File: `components/ui/MapPicker.tsx`**
- Lines 52-55, 138, 167, 191: Remove location logging

**File: `components/Footer.tsx`**
- Line 12: Remove newsletter signup console.log

---

### 2. Optional: Remove Data Viewing Page (If Not Needed)

**Decision Required**: Is the `/data` page needed in production?

If **NO**, delete:
- `/app/data/page.tsx` - Data viewing interface
- `/app/api/zoho-data/route.ts` - Data fetching API
- `/lib/utils/columnCategories.ts` - Column metadata
- `/components/ui/Table.tsx` - Table component

If **YES**, clean up:
- Remove console.log at line 295 in `/app/data/page.tsx`

---

### 3. Environment Variables Validation

**File: `.env`**

Ensure all required variables are set:
```env
# Single Token Approach (Recommended)
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# OR Service-Specific (Fallback)
ZOHO_CRM_CLIENT_ID=your_crm_client_id
ZOHO_CRM_CLIENT_SECRET=your_crm_client_secret
ZOHO_CRM_REFRESH_TOKEN=your_crm_refresh_token
ZOHO_CRM_API_DOMAIN=https://www.zohoapis.com.au

ZOHO_WORKDRIVE_CLIENT_ID=your_workdrive_client_id
ZOHO_WORKDRIVE_CLIENT_SECRET=your_workdrive_client_secret
ZOHO_WORKDRIVE_REFRESH_TOKEN=your_workdrive_refresh_token
ZOHO_WORKDRIVE_PARENT_FOLDER_ID=your_folder_id

# Application
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

---

### 4. Remove Commented Code

**File: `app/globals.css`**
- Lines 78-85: Remove commented CSS rules

---

### 5. Production Build Test

Run these commands to ensure production readiness:

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Build for production
npm run build

# Test production build locally
npm start
```

---

### 6. Security Checklist

- [ ] All API keys in `.env` (never in code)
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded credentials
- [ ] No sensitive data in console logs
- [ ] Error messages don't expose system internals
- [ ] CORS configured properly (if needed)
- [ ] Rate limiting considered for API routes

---

### 7. Performance Optimizations

**Already Implemented:**
- ✅ Token caching (55-minute expiry)
- ✅ Form persistence with sessionStorage
- ✅ Memoized components
- ✅ Dynamic imports for maps (SSR disabled)
- ✅ Image optimization with Next.js Image

**Consider Adding:**
- [ ] API response caching (if applicable)
- [ ] Database connection pooling (if using DB)
- [ ] CDN for static assets
- [ ] Compression middleware

---

### 8. Monitoring & Logging (Production)

**Recommended Setup:**
- [ ] Error tracking (Sentry, Bugsnag, etc.)
- [ ] Performance monitoring (Vercel Analytics, New Relic)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Log aggregation (Datadog, Loggly)

**Current Logging:**
- Console.error for errors (good for Vercel logs)
- No structured logging (consider adding)

---

### 9. Testing Before Deployment

**Manual Testing:**
- [ ] Test all 4 forms (Accident, Defect, Hazard, Complaint)
- [ ] Test member validation
- [ ] Test aircraft lookup
- [ ] Test file uploads (max 25 files, 256MB)
- [ ] Test form persistence (refresh page)
- [ ] Test PDF generation
- [ ] Test on mobile devices
- [ ] Test with slow network (throttle)

**API Testing:**
- [ ] Test Zoho CRM connection
- [ ] Test Zoho WorkDrive connection
- [ ] Test OccurrenceId generation
- [ ] Test error handling (invalid data)

---

### 10. Deployment Configuration

**Vercel (Recommended):**
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add ZOHO_CRM_CLIENT_ID
vercel env add ZOHO_CRM_CLIENT_SECRET
# ... (add all env vars)
```

**Environment Variables:**
- Set all `.env` variables in Vercel dashboard
- Use different tokens for staging/production
- Enable "Automatically expose System Environment Variables"

---

## 📝 Quick Cleanup Script

To remove all debug console.log statements automatically:

```bash
# Backup first!
git add -A
git commit -m "Backup before cleanup"

# Remove console.log (keep console.error and console.warn)
# Manual review recommended after running this
```

**Note:** Manual review is safer than automated cleanup for production code.

---

## ✨ Production-Ready Checklist

- [x] Remove test/unused API routes
- [ ] Remove debug console.log statements
- [ ] Validate environment variables
- [ ] Remove commented code
- [ ] Test production build
- [ ] Security audit
- [ ] Performance check
- [ ] Set up monitoring
- [ ] Manual testing complete
- [ ] Deploy to staging first
- [ ] Final production deployment

---

## 🚀 Deployment Steps

1. **Staging Deployment**
   ```bash
   vercel --env staging
   ```

2. **Test on Staging**
   - Submit test forms
   - Verify Zoho integration
   - Check all features

3. **Production Deployment**
   ```bash
   vercel --prod
   ```

4. **Post-Deployment**
   - Monitor error logs
   - Check performance metrics
   - Verify form submissions in Zoho CRM

---

## 📞 Support

For issues during deployment:
- Check Vercel logs: `vercel logs`
- Check Zoho API status
- Review error tracking dashboard
- Contact development team

---

**Last Updated:** 2025-10-21
**Status:** Ready for manual cleanup and deployment
