# 🚀 IMPLEMENTATION SETUP GUIDE
## Email Notifications + Payment Processing + Database Tables

**Completion Date**: January 16, 2025  
**Status**: Ready for Deployment  
**Total Implementation Time**: 2-3 hours  

---

## 📋 TABLE OF CONTENTS

1. [Database Setup](#database-setup)
2. [Email Notifications (Resend)](#email-notifications-resend)
3. [Payment Processing (Stripe)](#payment-processing-stripe)
4. [Environment Variables](#environment-variables)
5. [Testing & Deployment](#testing--deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🗄️ DATABASE SETUP

### Step 1: Apply Migrations

Execute these SQL migrations in your Supabase dashboard (SQL Editor):

#### Migration 1: Create Messages Table
**File**: `supabase/migrations/003_create_messages_table.sql`

```bash
# Execute in Supabase SQL Editor
```

**What it creates**:
- `messages` table for parent-teacher communication
- Indexes for fast queries
- 4 indexes for common search patterns

**Fields**:
- `id` (UUID) - Unique identifier
- `sender_id` - User who sent the message
- `receiver_id` - User who received the message
- `content` - Message body
- `read` - Boolean flag
- `school_id` - Multi-tenant isolation

#### Migration 2: Messages RLS Policies
**File**: `supabase/migrations/004_messages_rls_policies.sql`

```bash
# Execute in Supabase SQL Editor
```

**What it does**:
- Enables Row Level Security on messages table
- Users can only see messages they sent or received
- Admins can see all messages in their school

#### Migration 3: Invoices RLS Policies
**File**: `supabase/migrations/005_invoices_rls_policies.sql`

```bash
# Execute in Supabase SQL Editor
```

**What it does**:
- Adds complete RLS to invoices table
- Students see own invoices
- Parents see invoices for linked children
- Admins/Bursars can manage all invoices

### Step 2: Verify Migrations

```sql
-- Check messages table exists
SELECT * FROM messages LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('messages', 'invoices');

-- Check indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'messages';
```

---

## 📧 EMAIL NOTIFICATIONS (RESEND)

### Step 1: Create Resend Account

1. Go to [Resend.com](https://resend.com)
2. Sign up with your email
3. Create a project (e.g., "EduGemini")
4. Get your **API Key** from settings

### Step 2: Deploy Edge Function

The email edge function is already created at: `supabase/functions/send-notifications/index.ts`

**Deploy it**:
```bash
# From your project root
supabase functions deploy send-notifications

# You'll be prompted to enter the RESEND_API_KEY
```

### Step 3: Set Environment Variable

In Supabase Dashboard:
1. Go to **Settings → Edge Functions**
2. Click **send-notifications** function
3. Click **Settings** (gear icon)
4. Add secret:
   - Key: `RESEND_API_KEY`
   - Value: `YOUR_RESEND_API_KEY_HERE`
5. Click **Update**

### Step 4: Configure Email From Address

In Resend Dashboard:
1. Go to **Senders** 
2. Add domain or use default `notifications@edugemini.app`
3. Verify the domain (if using custom domain)

### Step 5: Test Email Function

```bash
# Test the edge function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "attendance",
    "recipient": {
      "email": "parent@example.com",
      "name": "John Parent"
    },
    "data": {
      "studentName": "Alice Student",
      "studentClass": "SS1",
      "date": "2025-01-16",
      "reason": "Sick"
    },
    "schoolName": "Demo School",
    "schoolEmail": "school@example.com"
  }'
```

### Email Templates Included

The `send-notifications` function includes templates for:

1. **Attendance Alerts** 📋
   - Sent when student is absent
   - Shows date, class, reason
   - Parent receives notification

2. **Result Notifications** 📊
   - Sent when results are published
   - Shows subject, score, term
   - Parent receives notification

3. **Fee Payments** 💰
   - Sent when fee is due
   - Shows amount, due date
   - Parent receives notification

4. **Messages** 💬
   - Sent when parent/teacher sends message
   - Shows sender name and preview
   - Recipient receives notification

---

## 💳 PAYMENT PROCESSING (STRIPE)

### Step 1: Create Stripe Account

1. Go to [Stripe.com](https://stripe.com)
2. Sign up and create account
3. Verify email and business details
4. Go to **Developers → API Keys**
5. Get:
   - **Publishable Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)

### Step 2: Deploy Payment Edge Functions

Two edge functions need to be deployed:

#### Function 1: Create Payment Intent
**File**: `supabase/functions/create-payment-intent/index.ts`

```bash
supabase functions deploy create-payment-intent
# Enter STRIPE_SECRET_KEY when prompted
```

#### Function 2: Payment Webhook Handler
**File**: `supabase/functions/payment-webhook/index.ts`

```bash
supabase functions deploy payment-webhook
# Enter STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET when prompted
```

### Step 3: Set Edge Function Secrets

In Supabase Dashboard → Settings → Edge Functions:

For **create-payment-intent**:
- Key: `STRIPE_SECRET_KEY`
- Value: `sk_test_YOUR_SECRET_KEY`

For **payment-webhook**:
- Key: `STRIPE_SECRET_KEY`
- Value: `sk_test_YOUR_SECRET_KEY`
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: `whsec_test_YOUR_WEBHOOK_SECRET` (from Step 4)

### Step 4: Configure Stripe Webhook

1. In Stripe Dashboard → **Developers → Webhooks**
2. Click **Add Endpoint**
3. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook`
4. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Get **Signing Secret** (whsec_...)
6. Add to Edge Function secrets (see Step 3)

### Step 5: Update Frontend Environment

Add to `.env.local`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

Or set in `.env`:
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

### Step 6: Test Payment Flow

```bash
# Test creating payment intent
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "currency": "ngn",
    "studentId": "student-123",
    "studentName": "John Doe",
    "schoolId": "school-123",
    "schoolName": "Demo School",
    "feeDescription": "School Fees"
  }'
```

---

## 🔐 ENVIRONMENT VARIABLES

### Add these to your `.env` or Supabase secrets:

```bash
# RESEND EMAIL SERVICE
RESEND_API_KEY=re_YOUR_RESEND_API_KEY

# STRIPE PAYMENT PROCESSING
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET

# Already set:
VITE_GEMINI_API_KEY=AIzaSyD50Zp9YLZdu2a4hM3yiwGeCd2q7L2Qz-s
VITE_SUPABASE_URL=https://nhmyuoxqzhspwkmggbkz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Set Them:

**For Supabase Edge Functions:**
- Settings → Edge Functions → Individual Function → Secrets

**For Frontend (Next.js/Vite):**
- `.env.local` file (local development)
- Vercel/Netlify dashboard (production)

**For Testing:**
- Use Stripe test keys (they work in sandbox mode)

---

## 🧪 TESTING & DEPLOYMENT

### Phase 1: Unit Testing (15 minutes)

#### Test Email Sending
```typescript
import { sendEmailNotification } from './src/lib/notificationService';

// Test attendance alert email
await sendEmailNotification(
  'parent@example.com',
  'John Parent',
  'attendance',
  {
    studentName: 'Alice',
    studentClass: 'SS1',
    date: '2025-01-16',
    reason: 'Sick'
  },
  'Test School'
);
```

#### Test Payment Intent Creation
```typescript
import { supabase } from './src/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();

const response = await supabase.functions.invoke('create-payment-intent', {
  body: {
    amount: 150000,
    currency: 'ngn',
    studentId: 'test-student',
    studentName: 'Test Student',
    schoolId: 'test-school',
    schoolName: 'Test School',
    feeDescription: 'Test Fee'
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});

console.log('Payment Intent:', response.data);
```

### Phase 2: Integration Testing (30 minutes)

#### Test Full Payment Flow
1. Go to `/financial/pay` page
2. Search for a student
3. Select some fees
4. Click "Proceed to Payment"
5. Enter test card: `4242 4242 4242 4242`
6. Enter any future date for expiry
7. Enter any CVC (e.g., 123)
8. Verify payment in Stripe dashboard

#### Test Email Notifications
1. Mark a student absent
2. Check parent's email for attendance alert
3. Publish grades
4. Check parent's email for results notification

#### Test Messages Table
1. Go to Parent Portal
2. Click "Messaging" tab
3. Send a message to a teacher
4. Verify message appears in database

### Phase 3: Production Deployment (30 minutes)

#### Before Going Live:
1. ✅ Test all features in sandbox mode
2. ✅ Verify email templates look good
3. ✅ Test RLS policies (ensure data isolation)
4. ✅ Load test with 100+ concurrent payments
5. ✅ Check error handling

#### Deployment Steps:
```bash
# 1. Deploy database migrations
# (Execute in Supabase SQL Editor)

# 2. Deploy edge functions
supabase functions deploy send-notifications
supabase functions deploy create-payment-intent
supabase functions deploy payment-webhook

# 3. Set all environment secrets
# (In Supabase Dashboard)

# 4. Update frontend code
git add -A
git commit -m "feat: add email notifications, payments, and messaging"
git push origin main

# 5. Deploy to production (Vercel/Netlify)
# (Your CI/CD pipeline)

# 6. Monitor logs
# Go to Supabase Dashboard → Edge Functions → Logs
```

---

## 🛠️ TROUBLESHOOTING

### Email Not Sending

**Problem**: Email function returns error  
**Solutions**:
1. Verify `RESEND_API_KEY` is set correctly
2. Check function logs: Supabase → Edge Functions → send-notifications → Logs
3. Verify email format is valid
4. Check Resend account has credits

**Test with**:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"attendance","recipient":{"email":"test@example.com","name":"Test"},"data":{"studentName":"Test","date":"2025-01-16"},"schoolName":"School"}'
```

### Payment Intent Creation Fails

**Problem**: `create-payment-intent` returns error  
**Solutions**:
1. Check `STRIPE_SECRET_KEY` is correct (should start with `sk_test_`)
2. Verify amount is positive integer
3. Check auth token is valid
4. Review Edge Function logs

**Common Error**: "Amount must be greater than 0"
- Solution: Ensure amount is > 0 (e.g., 150000 for 1500₦)

### Webhook Not Triggering

**Problem**: Payment webhook doesn't update database  
**Solutions**:
1. Verify webhook URL is correct: `https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook`
2. Check webhook signature secret matches
3. Verify Stripe webhook is configured
4. Review Edge Function logs
5. Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

**Test Webhook Locally**:
```bash
# Install Stripe CLI
# Then:
stripe listen --forward-to http://localhost:3000/functions/v1/payment-webhook

# In another terminal:
stripe trigger payment_intent.succeeded
```

### Messages Table Not Working

**Problem**: Messages not saving or queries fail  
**Solutions**:
1. Verify migration was executed successfully
2. Check RLS policies are enabled
3. Ensure `school_id` is being passed correctly
4. Verify user has correct role

**Verify Table**:
```sql
-- Check table exists
SELECT * FROM messages LIMIT 1;

-- Check RLS is enabled
SELECT * FROM pg_tables WHERE tablename = 'messages' AND rowsecurity = true;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

### Invoice RLS Not Working

**Problem**: Parents can't see their children's invoices  
**Solutions**:
1. Verify `linked_students` array is populated in users table
2. Check RLS policy uses correct parent-student link
3. Ensure `school_id` matches

**Verify Data**:
```sql
-- Check parent's linked students
SELECT linked_students FROM users WHERE id = 'parent-id' AND role = 'parent';

-- Check invoice exists
SELECT * FROM invoices WHERE student_id = 'student-id';
```

---

## 📞 SUPPORT & RESOURCES

### Documentation Links
- **Resend**: https://resend.com/docs
- **Stripe**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

### API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/functions/v1/send-notifications` | POST | Send email notifications |
| `/functions/v1/create-payment-intent` | POST | Create Stripe payment intent |
| `/functions/v1/payment-webhook` | POST | Handle Stripe webhook |

### New Services Updated

| Service | New Functions |
|---------|---------------|
| `notificationService.ts` | `sendEmailNotification()`, `sendAttendanceAlert()`, `sendResultNotification()`, `sendFeeNotification()`, `sendMessageNotification()` |
| `PayForStudents.tsx` | Full Stripe integration with payment flow |

### Database Tables

| Table | Status | Purpose |
|-------|--------|---------|
| `messages` | ✅ Created | Parent-teacher communication |
| `invoices` | ✅ Updated RLS | Student fee invoices |

---

## ✨ QUICK START CHECKLIST

- [ ] Create Resend account and get API key
- [ ] Create Stripe account and get API/Secret keys
- [ ] Execute 3 database migrations in Supabase SQL Editor
- [ ] Deploy 3 edge functions: `send-notifications`, `create-payment-intent`, `payment-webhook`
- [ ] Set all environment secrets in Supabase Dashboard
- [ ] Configure Stripe webhook
- [ ] Test email sending
- [ ] Test payment creation
- [ ] Test payment webhook
- [ ] Test message table RLS
- [ ] Test invoice table RLS
- [ ] Deploy to production

---

**Estimated Total Time**: 2-3 hours  
**Difficulty**: Medium  
**Go-Live Ready**: Yes ✅

Once complete, your platform will have:
- ✅ Production-ready email notifications
- ✅ Stripe payment processing integrated
- ✅ Parent-teacher messaging system
- ✅ Complete invoice management with proper security
