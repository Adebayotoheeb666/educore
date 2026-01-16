# Phase 1: Security Hardening - Implementation Checklist

**Quick Reference for Phase 1 Deployment**

## Pre-Deployment (Do This First)

- [ ] Read `SECURITY_HARDENING_PHASE1.md` completely
- [ ] Backup production database
- [ ] Test in staging environment
- [ ] Have Supabase CLI installed: `npm install -g supabase`
- [ ] Have Supabase admin access
- [ ] Notify team about timeline

## Files Created/Modified

### New Files (Already Created ✅)

| File | Purpose | Status |
|------|---------|--------|
| `supabase/migrations/001_enable_rls_policies.sql` | RLS policies for all tables | ✅ Created |
| `supabase/functions/gemini-proxy/index.ts` | Edge Function to proxy Gemini | ✅ Created |
| `src/lib/validationSchemas.ts` | Zod validation schemas | ✅ Created |
| `src/lib/rateLimiter.ts` | Rate limiting & throttling | ✅ Created |
| `SECURITY_HARDENING_PHASE1.md` | Full deployment guide | ✅ Created |

### Modified Files

| File | Change | Status |
|------|--------|--------|
| `src/lib/gemini.ts` | Use Edge Function instead of direct API | ✅ Done |

### No Changes Needed

- `package.json` - All dependencies already installed
- `tailwind.config.js` - No changes
- Routing/Components - No breaking changes

---

## Deployment Steps

### 1️⃣ Deploy RLS Policies (30 min)

```bash
# 1. Install/verify Supabase CLI
supabase --version

# 2. Login if needed
supabase login

# 3. Link to staging project (TEST FIRST!)
supabase link --project-ref your_staging_project_id

# 4. Push the migration
supabase db push

# 5. Verify RLS is enabled
# Go to: Supabase Dashboard > Authentication > Policies
# Check all tables have RLS enabled ✅

# 6. Test permissions in staging
# Create test users in different schools
# Verify they can't see each other's data ✅

# 7. Link to production
supabase link --project-ref your_production_project_id

# 8. Deploy to production
supabase db push

# ✅ Done! All tables now have RLS
```

**Rollback if needed:**
```sql
-- Disable RLS (TEMPORARY)
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ... etc
```

### 2️⃣ Deploy Gemini Edge Function (45 min)

```bash
# 1. Set Gemini API key in secrets
supabase secrets set GEMINI_API_KEY="sk-..."

# 2. Verify it was set
supabase secrets list

# 3. Deploy the edge function
supabase functions deploy gemini-proxy

# 4. Test it works
curl -X POST https://your_project.supabase.co/functions/v1/gemini-proxy \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generateLessonNote",
    "params": {"topic":"Test","subject":"Test","level":"Test"},
    "schoolId": "test",
    "userId": "test"
  }'

# Expected: {"success": true, "data": "..."}
# ✅ Done! Gemini calls now proxied
```

### 3️⃣ Update Application Code (1 hour)

```bash
# 1. Verify new files are present
ls -la src/lib/validationSchemas.ts ✅
ls -la src/lib/rateLimiter.ts ✅
ls -la src/lib/gemini.ts ✅
ls -la supabase/functions/gemini-proxy/index.ts ✅

# 2. Verify npm install (should already work)
npm install

# 3. Remove old env variable
# Edit .env.local or .env and REMOVE:
# VITE_GEMINI_API_KEY=...

# 4. Restart dev server
npm run dev

# 5. Test Gemini service
# In browser console:
# await window.geminiService.generateLessonNote(...)
# Should work without API key! ✅
```

### 4️⃣ Add Validation to Forms (2 hours)

For each form, add validation:

```typescript
// Example: In StaffCreationModal.tsx
import { validateInput, StaffCreationSchema } from '../lib/validationSchemas';

const handleSubmit = async (formData) => {
  // Validate before sending
  const validation = await validateInput(StaffCreationSchema, formData);
  
  if (!validation.success) {
    // Show errors
    console.error(validation.errors);
    setErrors(validation.errors);
    return;
  }
  
  // Use validated data
  await api.createStaff(validation.data);
};
```

**Forms to update:**
- [ ] `components/StaffCreationModal.tsx` - Use `StaffCreationSchema`
- [ ] `components/BulkStudentImport.tsx` - Use `BulkStudentImportSchema`
- [ ] `pages/GradeEntry.tsx` - Use `GradeEntrySchema`
- [ ] `pages/AttendanceTracking.tsx` - Use `AttendanceRecordSchema`
- [ ] `pages/Login.tsx` - Use `LoginSchema`

Each validation takes ~20 min:
- Import schema
- Call validateInput()
- Show errors if validation fails
- Use validated data on success

### 5️⃣ Add Rate Limit Warnings (1 hour)

```typescript
// Example component
import { geminiService } from '../lib/gemini';

function LessonGenerator() {
  const [warning, setWarning] = useState('');

  useEffect(() => {
    const status = geminiService.getRateLimitStatus('generateLessonNote', userId);
    if (status.warningMessage) {
      setWarning(status.warningMessage);
    }
  }, [userId]);

  return (
    <>
      {warning && <div className="text-yellow-600">{warning}</div>}
      {/* ... rest of component ... */}
    </>
  );
}
```

**Pages to update:**
- [ ] `pages/LessonGenerator.tsx`
- [ ] `pages/ExamBuilder.tsx`
- [ ] `pages/PaperScanner.tsx`
- [ ] `pages/StudentPortal.tsx`

---

## Testing Checklist

### Automated Tests

```bash
# Test validation schemas
npm test -- validationSchemas

# Test rate limiter
npm test -- rateLimiter

# Type check
npm run build
```

### Manual Testing (Staging)

```bash
# 1. Test RLS Isolation
# - Login as Admin A
# - Try to view Admin B's students
# - Should get empty list ✅

# 2. Test Gemini Proxy
# - Open DevTools > Network
# - Generate a lesson
# - Check POST /gemini-proxy
# - Should NOT see API key in body ✅

# 3. Test Rate Limiting
# - Generate 12 lesson notes rapidly
# - 11th should succeed
# - 12th should fail with "Rate limit exceeded" ✅

# 4. Test Validation
# - Enter invalid email in login
# - Should show error before sending to server ✅
```

### Integration Testing

```bash
# Test in real browser
1. Login as different roles (admin, teacher, student, parent)
2. Verify each sees only their school's data
3. Generate a lesson (uses Gemini)
4. Record attendance
5. View grades
6. All should work without errors ✅
```

---

## Verification Checklist

After all deployments, verify:

- [ ] All 15 tables have RLS enabled
- [ ] RLS policies are in Supabase dashboard
- [ ] Gemini Edge Function is deployed and active
- [ ] `VITE_GEMINI_API_KEY` removed from client
- [ ] `GEMINI_API_KEY` set in Supabase secrets
- [ ] All validation schemas are importable
- [ ] Rate limiter can be instantiated
- [ ] Gemini service uses Edge Function
- [ ] No console errors about missing API key
- [ ] Users can't see other schools' data
- [ ] Gemini calls succeed without exposing API key

---

## Monitoring (After Deployment)

### Daily Checks

```bash
# Check Gemini API cost
# Supabase Dashboard > Edge Functions > gemini-proxy > Invocations

# Check for RLS errors
# Application logs should not have "permission denied" errors

# Check Edge Function health
curl https://your_project.supabase.co/functions/v1/gemini-proxy
# Should return error about missing params (that's OK, means it's running)
```

### Weekly Reviews

- [ ] Review audit logs for suspicious access
- [ ] Check rate limit enforcement stats
- [ ] Verify API costs are lower
- [ ] Check for any RLS policy issues

---

## Troubleshooting Quick Fixes

### "Permission denied" errors

**Fix**: Add `.eq('school_id', schoolId)` to queries
```typescript
// Before: ❌
const { data } = await supabase.from('users').select('*');

// After: ✅
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('school_id', userProfile.schoolId);
```

### Edge Function returns 401

**Fix**: User needs to be authenticated
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) redirectToLogin();
```

### "API key is undefined" errors

**Fix**: API key removed from client (intentional!)
- Ensure Edge Function is deployed
- Check Supabase secrets are set
- Check browser is making requests to `/functions/v1/gemini-proxy`

### Validation errors on valid input

**Fix**: Update schema if too restrictive
```typescript
// If schema rejects valid emails
// Change required email to optional:
email: z.string().email().optional().or(z.literal('')),
```

---

## Rollback Plan

If critical issues occur:

```bash
# OPTION 1: Disable RLS (TEMPORARY - not recommended)
# Run in SQL Editor:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
# ... repeat for all tables

# OPTION 2: Revert to direct Gemini API (temporary)
# Edit src/lib/gemini.ts to use GoogleGenerativeAI directly again
# Restore VITE_GEMINI_API_KEY to .env

# OPTION 3: Rollback Edge Function
supabase functions delete gemini-proxy

# After fixing issues:
# 1. Re-enable RLS
# 2. Re-deploy Edge Function
# 3. Restore proxying in gemini.ts
```

---

## Success Criteria

Phase 1 is complete when:

✅ All RLS policies are deployed and tested  
✅ Gemini Edge Function is deployed and working  
✅ API key is NOT exposed in client code  
✅ All critical forms have validation  
✅ Rate limiting is enforced  
✅ Users cannot see other schools' data  
✅ All Gemini calls go through Edge Function  
✅ Audit logs show access attempts  
✅ No "permission denied" errors in logs  
✅ Team is trained on new security model  

---

## Time Estimate

| Task | Time | Status |
|------|------|--------|
| 1. Deploy RLS Policies | 30 min | ⏳ TODO |
| 2. Deploy Gemini Edge Function | 45 min | ⏳ TODO |
| 3. Update Application Code | 1 hour | ⏳ TODO |
| 4. Add Form Validation | 2 hours | ⏳ TODO |
| 5. Add Rate Limit Warnings | 1 hour | ⏳ TODO |
| 6. Testing & Verification | 2 hours | ⏳ TODO |
| 7. Documentation & Training | 1 hour | ⏳ TODO |
| **TOTAL** | **~8 hours** | **Ready** |

**Can be split across 2-3 days with 4-5 hours per day**

---

## Next Phase

After Phase 1 is approved and tested, move to:
- **Phase 2**: Complete Student Portal features
- **Phase 3**: Complete Parent Portal features

See `PHASE2_ROADMAP.md` for details (coming soon).

---

## Need Help?

1. **Detailed Guide**: See `SECURITY_HARDENING_PHASE1.md`
2. **Supabase Docs**: https://supabase.com/docs
3. **Edge Functions**: https://supabase.com/docs/guides/functions
4. **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
5. **Rate Limiting**: See `src/lib/rateLimiter.ts` comments

---

**Status**: ✅ Ready for Implementation  
**Created**: 2025-01-16  
**Last Updated**: 2025-01-16
