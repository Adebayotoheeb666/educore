# EduCore Platform: Critical Security Remediation Guide

This document provides step-by-step instructions to fix security gaps identified in the audit.

---

## PRIORITY 1: RLS VERIFICATION & ENFORCEMENT

### Issue
Staff onboarding creates profiles in the DB but no corresponding Auth users. Teachers can mark attendance only because of client-side filtering, but RLS should block unauthorized access at the database level.

### Risk
- Teacher from School A could manually craft a query to read School B's attendance data
- Cross-tenant data leakage if RLS is incomplete or misconfigured

### Solution: Comprehensive RLS Audit

**Step 1: List all tables in your Supabase project**
```bash
supabase db list
```

**Step 2: For EACH table, verify RLS is enabled:**
```bash
# In Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run:

SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- For each table, verify RLS is ON:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

**Step 3: Review every RLS policy manually**

Expected policies for critical tables:

#### Table: `attendance`
```sql
-- Policy: Teachers can view attendance for their assigned classes
CREATE POLICY "Teachers read own class attendance"
ON attendance
FOR SELECT
USING (
  auth.uid() IN (
    SELECT DISTINCT sa.user_id
    FROM staff_assignments sa
    JOIN student_classes sc ON sa.assigned_class_id = sc.id
    WHERE sc.student_id = attendance.student_id
    AND sa.school_id = (
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  )
);

-- Policy: Students can view their own attendance
CREATE POLICY "Students read own attendance"
ON attendance
FOR SELECT
USING (
  student_id = (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

-- Policy: Parents can view linked child attendance
CREATE POLICY "Parents read linked child attendance"
ON attendance
FOR SELECT
USING (
  student_id IN (
    SELECT student_id FROM parent_student_links
    WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);
```

#### Table: `results`
```sql
-- Similar structure to attendance
-- Teachers can write results for assigned classes/subjects
-- Students/Parents can read their own results
```

#### Table: `messages`
```sql
-- Policy: Users can only read messages they're part of
CREATE POLICY "Users read their own messages"
ON messages
FOR SELECT
USING (
  auth.uid() IN (sender_id, recipient_id)
  AND school_id = (SELECT school_id FROM users WHERE id = auth.uid())
);
```

#### Table: `financial_transactions`
```sql
-- Policy: Parents can read their linked child's transactions
-- Bursars can read school transactions
-- Admins can read all school transactions
CREATE POLICY "Parents read child transactions"
ON financial_transactions
FOR SELECT
USING (
  student_id IN (
    SELECT student_id FROM parent_student_links
    WHERE parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);

CREATE POLICY "Bursars read school transactions"
ON financial_transactions
FOR SELECT
USING (
  school_id = (SELECT school_id FROM users WHERE id = auth.uid())
  AND (SELECT role FROM users WHERE id = auth.uid()) IN ('bursar', 'admin')
);
```

#### Table: `parent_student_links`
```sql
-- Policy: Parents can only read their own links
CREATE POLICY "Parents read own links"
ON parent_student_links
FOR SELECT
USING (
  parent_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);
```

**Step 4: Create Migration File**

If policies are missing, create: `supabase/migrations/020_fix_rls_coverage.sql`

```sql
-- Enable RLS on all tables that don't have it yet
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add the policies above here
-- ... (copy policy statements from above)
```

**Step 5: Deploy**
```bash
supabase migration up
```

**Step 6: Test**
```bash
# Create integration test: tests/rls-cross-tenant.test.ts
import { createClient } from '@supabase/supabase-js';

const schoolA_user = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

await schoolA_user.auth.signInWithPassword({
  email: 'teacher-schoola@schoola.educore.app',
  password: 'test'
});

// Try to read School B attendance - should fail
const { data, error } = await schoolA_user
  .from('attendance')
  .select('*')
  .eq('school_id', 'school-b-id');

expect(error).toBeTruthy(); // Should be permission denied
expect(data).toBeNull();
```

---

## PRIORITY 2: SECURE STAFF INVITE FLOW

### Current Problem
**File:** `src/lib/staffService.ts` (lines 39-60)

```typescript
// ❌ CURRENT INSECURE APPROACH:
// 1. Creates user in DB with random docId
// 2. User cannot login until Auth user exists (manual sync needed)
// 3. Admin shares password verbally/insecurely
// 4. No invite email, no audit trail

const docId = crypto.randomUUID();
await supabase.from('users').insert({
    id: docId,  // ❌ Auth will have different ID!
    school_id: schoolId,
    role: data.role,
    staff_id: staffId,
    // ... no auth_uid linking
});
```

### Solution: Create Staff Invite Edge Function

**File:** `supabase/functions/invite-staff/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface InviteRequest {
  email: string;
  fullName: string;
  schoolId: string;
  role: "staff" | "bursar" | "admin";
  specialization?: string;
  phoneNumber?: string;
  adminId: string; // Admin creating the staff account
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const requestBody: InviteRequest = await req.json();

    // Validate input
    if (!requestBody.email || !requestBody.schoolId || !requestBody.adminId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize admin client with service role (server-only)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify admin creating this staff is actually admin of the school
    const { data: adminProfile } = await adminClient
      .from("users")
      .select("*")
      .eq("id", requestBody.adminId)
      .eq("school_id", requestBody.schoolId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Not an admin of this school" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Generate staff ID
    const staffPrefix = requestBody.schoolId.substring(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const staffId = `STF-${staffPrefix}-${randomSuffix}`;

    // 3. Create Auth user via admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: requestBody.email,
      email_confirm: false, // Send confirmation email
      user_metadata: {
        full_name: requestBody.fullName,
        role: requestBody.role,
        school_id: requestBody.schoolId,
        staff_id: staffId,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: "Failed to create Auth user", details: authError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const authId = authData.user?.id;

    // 4. Create user profile in DB with correct auth_id
    const { error: profileError } = await adminClient
      .from("users")
      .insert({
        id: authId, // ✅ Use Auth UID as primary key
        school_id: requestBody.schoolId,
        email: requestBody.email,
        full_name: requestBody.fullName,
        role: requestBody.role,
        staff_id: staffId,
        phone_number: requestBody.phoneNumber,
        assigned_subjects: requestBody.specialization
          ? [requestBody.specialization]
          : [],
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Cleanup Auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authId);
      return new Response(
        JSON.stringify({ error: "Failed to create user profile" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Log action (audit trail)
    await adminClient.from("audit_logs").insert({
      school_id: requestBody.schoolId,
      actor_id: requestBody.adminId,
      action: "staff_invited",
      resource_type: "staff",
      resource_id: authId,
      details: {
        email: requestBody.email,
        staff_id: staffId,
        role: requestBody.role,
      },
      created_at: new Date().toISOString(),
    });

    // 6. Success - Auth user created and email sent by Supabase
    return new Response(
      JSON.stringify({
        success: true,
        message: "Staff invited successfully. Confirmation email sent.",
        staffId: staffId,
        authId: authId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

**Deploy:**
```bash
supabase functions deploy invite-staff
```

**Update:** `src/lib/staffService.ts`

```typescript
export const createStaffAccount = async (
    schoolId: string,
    adminId: string,
    data: CreateStaffParams
) => {
    // ✅ Call Edge Function instead of direct DB insert
    const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-staff`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                email: data.email,
                fullName: data.fullName,
                schoolId,
                role: data.role,
                specialization: data.specialization,
                phoneNumber: data.phoneNumber,
                adminId
            })
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to invite staff');
    }

    return {
        staffId: result.staffId,
        message: "Staff invited successfully. Confirmation email sent.",
        docId: result.authId
    };
};
```

---

## PRIORITY 3: ADMISSION NUMBER UNIQUENESS

### Issue
No DB constraint prevents duplicate admission numbers within a school. This could cause virtual email collisions.

**File:** Create migration `supabase/migrations/021_add_admission_uniqueness.sql`

```sql
-- Add unique constraint for admission_number per school
ALTER TABLE users
ADD CONSTRAINT unique_admission_per_school
UNIQUE (school_id, admission_number)
WHERE admission_number IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_admission_number_school ON users(school_id, admission_number)
WHERE admission_number IS NOT NULL;

-- Create index for staff_id lookups
CREATE INDEX idx_staff_id_school ON users(school_id, staff_id)
WHERE staff_id IS NOT NULL;
```

**Deploy:**
```bash
supabase migration up
```

---

## PRIORITY 4: REPLACE IN-MEMORY RATE LIMITER

### Current Problem
**File:** `supabase/functions/gemini-proxy/index.ts` (lines 31-50)

```typescript
// ❌ PROBLEM: In-memory Map
// - Lost on function restart
// - Not shared across Edge Function instances
// - Doesn't work at scale
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
```

### Solution A: Database-Backed Rate Limiter (Recommended)

**File:** Create migration `supabase/migrations/022_create_rate_limit_table.sql`

```sql
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limit_user_endpoint ON api_rate_limits(user_id, endpoint, window_end);

-- Auto-cleanup old entries
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM api_rate_limits WHERE window_end < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

**Update:** `supabase/functions/gemini-proxy/index.ts`

```typescript
async function checkRateLimitDB(
  userId: string,
  schoolId: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  // 1. Find or create rate limit record
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", "gemini-proxy")
    .gt("window_end", now.toISOString())
    .maybeSingle();

  if (!existing) {
    // Create new window
    await supabase.from("api_rate_limits").insert({
      user_id: userId,
      school_id: schoolId,
      endpoint: "gemini-proxy",
      request_count: 1,
      window_start: now.toISOString(),
      window_end: windowEnd.toISOString(),
    });
    return true;
  }

  // 2. Check if limit exceeded
  if (existing.request_count >= limit) {
    return false;
  }

  // 3. Increment count
  await supabase
    .from("api_rate_limits")
    .update({ request_count: existing.request_count + 1 })
    .eq("id", existing.id);

  return true;
}

// In serve() function:
const allowed = await checkRateLimitDB(
  requestBody.userId,
  requestBody.schoolId,
  10,
  60000
);

if (!allowed) {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfter: 60,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}
```

**Deploy:**
```bash
supabase migration up
supabase functions deploy gemini-proxy
```

### Solution B: Supabase Redis (Faster Alternative)

If your Supabase project supports Redis, use it for better performance:

```typescript
// Install Deno Redis client
// import { Redis } from "https://deno.land/x/redis@v0.29.3/mod.ts";

const redis = new Redis({
  hostname: Deno.env.get("REDIS_HOST"),
  port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
  password: Deno.env.get("REDIS_PASSWORD"),
});

async function checkRateLimitRedis(
  userId: string,
  schoolId: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<boolean> {
  const key = `ratelimit:${schoolId}:${userId}:gemini`;
  const current = await redis.incr(key);

  if (current === 1) {
    // First request in window, set expiry
    await redis.expire(key, windowSeconds);
  }

  return current <= limit;
}
```

---

## PRIORITY 5: PARENT LOGIN SEMANTICS

### Issue
Current logic allows parent to login using child's admission number, which blurs the distinction between parent and student roles.

**File:** `src/pages/Login.tsx` needs clarification

### Recommended Approach

**Option 1: Separate Parent Login** (Recommended)

```typescript
// Parent login should use:
// 1. Phone number (OTP)
// 2. Parent Email (if registered)
// 3. NOT admission number

// In Login.tsx:
if (mode === 'parent-login') {
  // Phone OTP or email
  // Links to parent_student_links table
  // Fetches linked students
  
  const children = await supabase
    .from('parent_student_links')
    .select('student_id, student: users(*)')
    .eq('parent_id', parentUserId);
}
```

**Option 2: Multi-Identity Parent** (If allowing same credential)

```typescript
// If parent uses admission number, explicitly check:
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('admission_number', input)
  .eq('school_id', selectedSchool)
  .maybeSingle();

// Check if this is a parent
const { data: parentLink } = await supabase
  .from('parent_student_links')
  .select('*')
  .eq('parent_id', user.id)
  .maybeSingle();

if (parentLink) {
  // Authenticate as parent
  session.role = 'parent';
  session.mode = 'parent_viewing_student'; // ← Explicit flag!
} else if (user.role === 'student') {
  // Authenticate as student
  session.role = 'student';
  session.mode = 'student';
}
```

**Recommended UI Change:**

```tsx
// In Login.tsx - make modes explicit:
<div className="space-y-4">
  <button onClick={() => setMode('student-login')}>
    Login as Student (Admission Number)
  </button>
  <button onClick={() => setMode('staff-login')}>
    Login as Staff/Teacher (Staff ID)
  </button>
  <button onClick={() => setMode('parent-login')}>
    Login as Parent (Phone Number OTP)
  </button>
  <button onClick={() => setMode('school-login')}>
    Login as School (Email)
  </button>
</div>
```

---

## PRIORITY 6: CREATE CROSS-TENANT SECURITY TESTS

**File:** `tests/security.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Cross-Tenant Security Tests', () => {
  let schoolAClient, schoolBClient;

  beforeAll(async () => {
    // Setup: Create two separate Supabase sessions for different schools
    schoolAClient = createClient(supabaseUrl, supabaseKey);
    schoolBClient = createClient(supabaseUrl, supabaseKey);

    // Login as teacher from School A
    await schoolAClient.auth.signInWithPassword({
      email: 'teacher@schoola.educore.app',
      password: 'test123',
    });

    // Login as teacher from School B
    await schoolBClient.auth.signInWithPassword({
      email: 'teacher@schoolb.educore.app',
      password: 'test456',
    });
  });

  it('Teacher from School A cannot read attendance from School B', async () => {
    const { data, error } = await schoolAClient
      .from('attendance')
      .select('*')
      .eq('school_id', 'school-b-uuid');

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(error?.code).toBe('PGRST116'); // Permission denied
  });

  it('Teacher from School A cannot modify grades from School B', async () => {
    const { error } = await schoolAClient
      .from('results')
      .update({ score: 100 })
      .eq('school_id', 'school-b-uuid');

    expect(error).toBeTruthy();
    expect(error?.code).toBe('PGRST116');
  });

  it('Parent can only read own children data', async () => {
    // Parent from School A
    const parentClient = createClient(supabaseUrl, supabaseKey);
    await parentClient.auth.signInWithPassword({
      email: 'parent@schoola.educore.app',
      password: 'test789',
    });

    // Try to read unlinked student results
    const { data, error } = await parentClient
      .from('results')
      .select('*')
      .eq('student_id', 'unlinked-student-uuid');

    expect(error || data?.length === 0).toBeTruthy();
  });

  it('Student can only read own attendance', async () => {
    const studentClient = createClient(supabaseUrl, supabaseKey);
    await studentClient.auth.signInWithPassword({
      email: 'student123@schoola.educore.app',
      password: 'student123',
    });

    // Try to read other student's attendance
    const { data, error } = await studentClient
      .from('attendance')
      .select('*')
      .neq('student_id', studentClient.auth.user().id);

    expect(error || data?.length === 0).toBeTruthy();
  });
});
```

**Run:**
```bash
npm run test -- tests/security.test.ts
```

---

## TIMELINE & CHECKLIST

### Week 1: Security Hardening
- [ ] Monday: RLS audit & verification (1-2 days)
- [ ] Wednesday: Apply missing RLS policies (1 day)
- [ ] Thursday: Implement staff invite Edge Function (2 days)
- [ ] Friday: Add admission number uniqueness constraint

### Week 2: Infrastructure & Testing
- [ ] Monday: Replace rate limiter (1-2 days)
- [ ] Wednesday: Create security tests (2 days)
- [ ] Thursday: Clarify parent login (1 day)
- [ ] Friday: Full security test suite pass

### Week 3: Deployment & Hardening
- [ ] All migrations deployed to staging
- [ ] Full regression testing
- [ ] Security audit sign-off
- [ ] Production deployment

---

## IMMEDIATE ACTION ITEMS

1. **TODAY**: Run RLS coverage audit using SQL queries above
2. **THIS WEEK**: Create & deploy staff invite Edge Function
3. **THIS WEEK**: Add admission number uniqueness constraint
4. **NEXT WEEK**: Replace rate limiter
5. **ONGOING**: Create automated security tests

---

## VERIFICATION CHECKLIST

After implementing these fixes:

- [ ] All tables have RLS enabled
- [ ] All RLS policies verified manually
- [ ] Automated cross-tenant security tests pass
- [ ] Staff invite flow tested end-to-end
- [ ] Admission number uniqueness working
- [ ] Rate limiter distributed (not in-memory)
- [ ] Parent login semantics documented
- [ ] GEMINI_API_KEY in Supabase secrets, not client
- [ ] All migrations deployed
- [ ] Audit logs showing staff creation via invite

---

## SUPPORT

For Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
For Edge Functions: https://supabase.com/docs/guides/functions
