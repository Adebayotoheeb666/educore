# 🚀 DEPLOYMENT CHECKLIST

**Status**: Implementation Complete ✅  
**Ready for Deployment**: YES  
**Estimated Deployment Time**: 45 minutes  

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. External Accounts Setup

- [ ] **Resend Account**
  - [ ] Sign up at https://resend.com
  - [ ] Create project
  - [ ] Copy API Key
  - [ ] Save: `RESEND_API_KEY`

- [ ] **Stripe Account**
  - [ ] Sign up at https://stripe.com
  - [ ] Go to Developers → API Keys
  - [ ] Copy Publishable Key
  - [ ] Copy Secret Key
  - [ ] Save: `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`

---

## 🗄️ DATABASE SETUP (Step 1)

### Execute Migrations in Supabase SQL Editor

**Location**: Supabase Dashboard → SQL Editor

#### Migration 3: Messages Table
```
File: supabase/migrations/003_create_messages_table.sql
Lines: 39
Time: 2 minutes
```

**Steps**:
1. [ ] Open Supabase SQL Editor
2. [ ] Create new query
3. [ ] Copy entire file content
4. [ ] Click "RUN"
5. [ ] Verify no errors

**Verify**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'messages';
-- Should return 1 row
```

---

#### Migration 4: Messages RLS Policies
```
File: supabase/migrations/004_messages_rls_policies.sql
Lines: 47
Time: 2 minutes
```

**Steps**:
1. [ ] Open Supabase SQL Editor
2. [ ] Create new query
3. [ ] Copy entire file content
4. [ ] Click "RUN"
5. [ ] Verify no errors

**Verify**:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'messages';
-- Should return 6 policies
```

---

#### Migration 5: Invoices RLS Policies
```
File: supabase/migrations/005_invoices_rls_policies.sql
Lines: 68
Time: 3 minutes
```

**Steps**:
1. [ ] Open Supabase SQL Editor
2. [ ] Create new query
3. [ ] Copy entire file content
4. [ ] Click "RUN"
5. [ ] Verify no errors

**Verify**:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'invoices';
-- Should return 7 policies
```

---

## 🔧 EDGE FUNCTIONS DEPLOYMENT (Step 2)

### Deploy send-notifications Function
```
File: supabase/functions/send-notifications/index.ts
Lines: 337
Time: 5 minutes
```

**Steps**:
```bash
# Terminal: From your project root
supabase functions deploy send-notifications

# You'll see:
# "Deploying function 'send-notifications'..."
# "Function deployed successfully with ID: xxxxxxxx"
```

**Verify**:
```bash
supabase functions list
# Should show: send-notifications (active)
```

---

### Deploy create-payment-intent Function
```
File: supabase/functions/create-payment-intent/index.ts
Lines: 213
Time: 5 minutes
```

**Steps**:
```bash
supabase functions deploy create-payment-intent

# You'll see:
# "Deploying function 'create-payment-intent'..."
# "Function deployed successfully with ID: xxxxxxxx"
```

---

### Deploy payment-webhook Function
```
File: supabase/functions/payment-webhook/index.ts
Lines: 247
Time: 5 minutes
```

**Steps**:
```bash
supabase functions deploy payment-webhook

# You'll see:
# "Deploying function 'payment-webhook'..."
# "Function deployed successfully with ID: xxxxxxxx"
```

---

## 🔐 ENVIRONMENT VARIABLES (Step 3)

### Set Edge Function Secrets

**Location**: Supabase Dashboard → Settings → Edge Functions

#### For send-notifications

1. [ ] Go to **Settings → Edge Functions**
2. [ ] Click **send-notifications**
3. [ ] Click **Settings** (gear icon)
4. [ ] Under "Secrets", click **Add Secret**
5. [ ] Enter:
   - **Key**: `RESEND_API_KEY`
   - **Value**: `re_xxxxxxxxxxxxxxxxxxxxxxxx`
6. [ ] Click **Update**

#### For create-payment-intent

1. [ ] Go to **Settings → Edge Functions**
2. [ ] Click **create-payment-intent**
3. [ ] Click **Settings**
4. [ ] Add Secret:
   - **Key**: `STRIPE_SECRET_KEY`
   - **Value**: ``
5. [ ] Click **Update**

#### For payment-webhook

1. [ ] Go to **Settings → Edge Functions**
2. [ ] Click **payment-webhook**
3. [ ] Click **Settings**
4. [ ] Add Secret #1:
   - **Key**: `STRIPE_SECRET_KEY`
   - **Value**: ``
5. [ ] Add Secret #2:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_test_xxxxxxxxxxxxxxxxxxxxxxxx` (from Step 4.2 below)
6. [ ] Click **Update**

---

## 🔗 STRIPE WEBHOOK SETUP (Step 4)

### Configure Webhook Endpoint

**Location**: Stripe Dashboard → Developers → Webhooks

1. [ ] Go to Stripe Dashboard
2. [ ] Click **Developers**
3. [ ] Click **Webhooks**
4. [ ] Click **Add Endpoint**

**Endpoint Details**:
- [ ] **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook`
- [ ] **Events**:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `charge.refunded`

5. [ ] Click **Add Endpoint**
6. [ ] Copy **Signing Secret** (whsec_...)
7. [ ] Save this value for Step 3 above

---

## 📝 CODE DEPLOYMENT (Step 5)

### Update Frontend Code

#### Option A: Using Git

```bash
# From project root
git add -A
git commit -m "feat: add email notifications, stripe payments, messaging"
git push origin main
```

#### Option B: Manual Deployment

Copy these files to your server/deployment:
- [ ] `supabase/functions/send-notifications/index.ts`
- [ ] `supabase/functions/create-payment-intent/index.ts`
- [ ] `supabase/functions/payment-webhook/index.ts`
- [ ] `supabase/migrations/003_create_messages_table.sql`
- [ ] `supabase/migrations/004_messages_rls_policies.sql`
- [ ] `supabase/migrations/005_invoices_rls_policies.sql`
- [ ] `src/pages/financial/PayForStudents.tsx`
- [ ] `src/lib/notificationService.ts`

---

## 🧪 TESTING (Step 6)

### Test Email Function

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "attendance",
    "recipient": {
      "email": "test@example.com",
      "name": "Test Parent"
    },
    "data": {
      "studentName": "John Student",
      "studentClass": "SS1",
      "date": "2025-01-16",
      "reason": "Sick"
    },
    "schoolName": "Test School",
    "schoolEmail": "school@test.com"
  }'
```

- [ ] Function returns `200 OK`
- [ ] Email received at test email address
- [ ] Email template looks correct
- [ ] All information is displayed

---

### Test Payment Function

```bash
# First, get an access token
# Then run:

curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "currency": "ngn",
    "studentId": "test-student-123",
    "studentName": "Test Student",
    "schoolId": "test-school-123",
    "schoolName": "Test School",
    "feeDescription": "School Fees"
  }'
```

- [ ] Function returns `200 OK`
- [ ] Response includes `clientSecret`
- [ ] Response includes `paymentIntentId`
- [ ] Check Stripe dashboard for payment intent

---

### Test PayForStudents UI

1. [ ] Navigate to `/financial/pay`
2. [ ] Search for a test student
3. [ ] Select student from results
4. [ ] Select fees to pay
5. [ ] Verify total amount calculation
6. [ ] Click "Proceed to Payment"
7. [ ] Verify order summary
8. [ ] Click "Pay" button
9. [ ] Verify success message
10. [ ] Check Stripe dashboard for transaction

---

### Test Messages Table

```sql
-- Test INSERT
INSERT INTO messages (sender_id, receiver_id, content, school_id, sender_name, sender_role, receiver_name)
VALUES (
  'test-user-1',
  'test-user-2',
  'Test message',
  'test-school',
  'Test Sender',
  'staff',
  'Test Receiver'
);

-- Test RLS (should only see own messages)
SELECT * FROM messages WHERE receiver_id = 'test-user-2';
-- Should show message above
```

- [ ] INSERT succeeds
- [ ] SELECT returns messages for current user
- [ ] RLS prevents seeing other users' messages

---

### Test Invoices RLS

```sql
-- Test as parent user
SELECT * FROM invoices WHERE student_id IN (
  SELECT UNNEST(linked_students) FROM users WHERE id = auth.uid()
);
-- Should only show invoices for linked children

-- Test as student
SELECT * FROM invoices WHERE student_id = auth.uid();
-- Should only show own invoices
```

- [ ] Parents see linked children's invoices
- [ ] Students see own invoices
- [ ] Admins see all invoices

---

## 📊 PRODUCTION VERIFICATION (Step 7)

- [ ] All 3 migrations executed without errors
- [ ] All 3 edge functions deployed successfully
- [ ] All environment secrets set
- [ ] Stripe webhook configured
- [ ] Email function sends emails correctly
- [ ] Payment function creates payment intents
- [ ] Webhook updates database on payment
- [ ] Messages RLS working (users can't see others' messages)
- [ ] Invoices RLS working (multi-child parent support)
- [ ] UI loads without errors
- [ ] No console errors in browser

---

## 🎯 POST-DEPLOYMENT (Step 8)

### Monitor & Verify

- [ ] Watch Supabase logs for errors
- [ ] Monitor Stripe dashboard for transactions
- [ ] Check email deliverability (Resend dashboard)
- [ ] Review error logs daily for first week
- [ ] Set up alerts for failed payments

### Setup Monitoring (Optional)

```bash
# Supabase logs
supabase functions logs send-notifications

# Real-time monitoring
# Go to: Supabase Dashboard → Edge Functions → Logs
```

---

## 🆘 ROLLBACK PLAN (If Needed)

### If Something Goes Wrong:

1. [ ] **Email not working?**
   - Check RESEND_API_KEY is set
   - Check function logs
   - Test with curl command above

2. [ ] **Payment not processing?**
   - Check STRIPE_SECRET_KEY is set
   - Verify webhook is configured
   - Check Stripe logs

3. [ ] **Need to disable feature?**
   - Remove environment secret from Edge Function
   - Function will fail gracefully
   - Users won't be able to pay/receive emails

4. [ ] **Database RLS too restrictive?**
   - Add broader policies
   - Run: `DROP POLICY policy_name ON table_name;`
   - Create new policy with wider permissions

---

## ✅ FINAL CHECKLIST

### Before Announcing to Users

- [ ] All tests passed
- [ ] Email working with real email addresses
- [ ] Payments working with Stripe test cards
- [ ] No console errors
- [ ] Loading states work correctly
- [ ] Error messages display properly
- [ ] Mobile responsive (check on phone)
- [ ] Dark mode looks good
- [ ] Documentation updated
- [ ] Team trained on new features

### Before Switching to Stripe Live Keys

- [ ] 1 week of testing with test keys
- [ ] 100+ test transactions processed
- [ ] No critical issues found
- [ ] All edge cases handled
- [ ] Support team ready
- [ ] Have budget for transaction fees
- [ ] Update documentation for live keys

---

## 📞 SUPPORT CONTACTS

**Resend Support**: https://resend.com/support  
**Stripe Support**: https://stripe.com/support  
**Supabase Docs**: https://supabase.com/docs  

---

## ⏱️ TIMING BREAKDOWN

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Database migrations (3x) | 7 min | ⏳ |
| 2 | Deploy edge functions (3x) | 15 min | ⏳ |
| 3 | Set environment variables | 10 min | ⏳ |
| 4 | Stripe webhook setup | 5 min | ⏳ |
| 5 | Code deployment | 5 min | ⏳ |
| 6 | Testing (email, payment, RLS) | 20 min | ⏳ |
| 7 | Production verification | 10 min | ⏳ |
| 8 | Monitoring setup (optional) | 5 min | ⏳ |
| | **TOTAL** | **77 min** | |

**Actual time will likely be 45-60 minutes with experience**

---

## 🎉 SUCCESS CRITERIA

You'll know everything is working when:

✅ Email received when student marked absent  
✅ Email received when grades published  
✅ Email received when fees are due  
✅ Payment creates transaction in database  
✅ Invoice status changes to "paid" after payment  
✅ Parent receives email about payment  
✅ Parents can see messages from teachers  
✅ Teachers can see messages from parents  
✅ Parents see invoices for their linked children only  
✅ No console errors in browser  
✅ All tests passing  

---

## 📞 NEXT STEPS

Once deployed, consider:

1. **Week 1**: Monitor closely for bugs
2. **Week 2**: Get user feedback
3. **Week 3**: Deploy wallet funding feature (optional)
4. **Week 4**: Set up SMS notifications (optional)

---

**Deployment Ready**: YES ✅  
**Go Live Date**: [YOUR_DATE]  
**Owner**: [YOUR_NAME]  
**Last Updated**: January 16, 2025  
