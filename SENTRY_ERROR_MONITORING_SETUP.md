# Sentry Error Monitoring Setup Guide

**Purpose**: Track application errors, crashes, and performance issues in production  
**Estimated Setup Time**: 15 minutes  
**Cost**: Free tier covers 5,000 events/month (sufficient for small-medium schools)

---

## STEP 1: Create Sentry Account

### 1.1 Sign Up
1. Go to [sentry.io](https://sentry.io/signup/)
2. Sign up with email or GitHub
3. Create organization (use your school name)
4. Create project

### 1.2 Select React as Platform
- When prompted, select **React**
- This will generate setup instructions

### 1.3 Get Your DSN
After project creation, you'll see a DSN (Data Source Name):
```
https://XXXXXXXXXXX@oxxxxx.ingest.sentry.io/XXXXXXX
```

**Save this** - you'll need it next.

---

## STEP 2: Install Sentry SDK

### 2.1 Install Package
```bash
npm install @sentry/react @sentry/tracing
```

### 2.2 Update package.json
Verify it shows:
```json
{
  "dependencies": {
    "@sentry/react": "^7.x.x",
    "@sentry/tracing": "^7.x.x"
  }
}
```

---

## STEP 3: Configure Sentry in Your App

### 3.1 Create Sentry Configuration File

Create `src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new BrowserTracing({
        tracingOrigins: [
          "localhost",
          /^\//,
          // Add your API endpoints here
          "supabase.co",
        ],
      }),
    ],
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Environment-specific configuration
    environment: import.meta.env.MODE,
    // Ignore certain errors that aren't useful
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors from ad blockers
      'NetworkError',
      // ResizeObserver errors (not critical)
      'ResizeObserver loop limit exceeded',
    ],
    // Capture breadcrumbs for context
    maxBreadcrumbs: 50,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request?.url?.includes('password')) {
        return null; // Don't send
      }
      return event;
    },
  });
};

/**
 * Capture exception with context
 */
export const captureException = (
  error: Error,
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.captureException(error, {
      contexts: {
        app: context,
      },
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture message
 */
export const captureMessage = (
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email: string, schoolId: string) => {
  Sentry.setUser({
    id: userId,
    email: email,
    schoolId: schoolId,
  });
};

/**
 * Clear user context on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};
```

### 3.2 Update main.tsx

Modify `src/main.tsx` to initialize Sentry:

```typescript
import { initSentry } from './lib/sentry';

// Initialize Sentry before rendering
initSentry();

// ... rest of your code
```

### 3.3 Wrap App with Error Boundary

Update `src/main.tsx`:

```typescript
import { ErrorBoundary } from "@sentry/react";

const FallbackComponent = () => (
  <div className="min-h-screen bg-red-500/10 flex items-center justify-center">
    <div className="bg-dark-card border border-red-500 rounded-lg p-6 max-w-md">
      <h1 className="text-2xl font-bold text-red-500 mb-2">Oops!</h1>
      <p className="text-gray-300 mb-4">
        Something went wrong. Our team has been notified.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
      >
        Go Home
      </button>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={FallbackComponent} showDialog>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
```

### 3.4 Set User Context When Authenticated

In `src/hooks/useAuth.ts`, add:

```typescript
import { setUserContext, clearUserContext } from '../lib/sentry';

export const useAuth = () => {
  // ... existing code ...

  useEffect(() => {
    // ... existing setup code ...

    if (session?.user && profile) {
      // Set Sentry user context
      setUserContext(profile.id, profile.email || '', profile.schoolId || '');
    } else {
      // Clear on logout
      clearUserContext();
    }
  }, [session, profile]);

  // ... rest of hook ...
};
```

---

## STEP 4: Set Environment Variable

### 4.1 Add to Your Environment

Add to your `.env.local` or CI/CD environment variables:

```
VITE_SENTRY_DSN=https://XXXXXXXXXXX@oxxxxx.ingest.sentry.io/XXXXXXX
```

**DO NOT commit this to git** - set it in:
- `.env.local` (local development)
- CI/CD secrets (GitHub Actions, Netlify)
- Environment variables (production hosting)

### 4.2 For Netlify

1. Go to Netlify Dashboard > Site Settings > Build & Deploy > Environment
2. Click **Edit variables**
3. Add:
   - Key: `VITE_SENTRY_DSN`
   - Value: Your DSN from Step 1.3

---

## STEP 5: Update Error Handling

Replace generic error logs with Sentry:

### 5.1 Before (Old Pattern)
```typescript
try {
  // code
} catch (err) {
  console.error('Error:', err);  // Generic logging
}
```

### 5.2 After (Sentry Pattern)
```typescript
import { captureException, captureMessage } from '../lib/sentry';

try {
  // code
} catch (err) {
  captureException(err instanceof Error ? err : new Error(String(err)), {
    userId: profile?.id,
    schoolId: schoolId,
    action: 'fetchData',
    timestamp: new Date().toISOString(),
  });
}
```

### 5.3 Example: Update Authentication Error Handling

In `src/pages/Login.tsx`:

```typescript
import { captureException } from '../lib/sentry';

try {
  // login code
} catch (err: any) {
  captureException(err, {
    loginMode: mode,
    attemptedEmail: email || 'N/A',
  });
  setError(err.message || 'Authentication failed');
}
```

---

## STEP 6: Test Sentry Integration

### 6.1 Local Testing

Create test error:

```typescript
// Add this button temporarily in Dashboard or any page
<button onClick={() => {
  throw new Error('Test error for Sentry');
}}>
  Test Sentry
</button>
```

### 6.2 Trigger Error and Check Sentry

1. Click the test button
2. Your app should show error boundary
3. Go to [sentry.io](https://sentry.io) dashboard
4. Check **Issues** - your test error should appear within seconds

### 6.3 Remove Test Button

Delete the test button from code.

---

## STEP 7: Configure Alerts

### 7.1 Set Up Email Alerts

1. Go to Sentry Project Settings > **Alerts**
2. Click **Create Alert Rule**
3. Set trigger:
   - When: "An event is seen"
   - If: "The event's level is equal to error or higher"
4. Action: "Send me an email"
5. Click **Save Rule**

### 7.2 Slack Integration (Optional)

1. In Sentry > Project Settings > **Integrations**
2. Search for "Slack"
3. Click **Install**
4. Follow Slack authorization
5. Create Slack alert rules

---

## STEP 8: Monitor and Respond

### 8.1 Daily Monitoring

Check Sentry dashboard:
- Errors by frequency
- New errors this week
- Error trends

### 8.2 Respond to Errors

For each new error:
1. Click error to see full details
2. Check stack trace
3. View user context (user ID, school ID)
4. Check breadcrumbs (what happened before error)
5. Fix in code
6. Deploy fix
7. Mark as resolved in Sentry

### 8.3 Track Release Health

1. Tag deployments in Sentry to track which version has errors
2. View "Release Health" to see error rates per version

---

## STEP 9: Advanced Configuration (Optional)

### 9.1 Capture User Feedback

```typescript
import * as Sentry from '@sentry/react';

export const captureUserFeedback = (comment: string) => {
  Sentry.captureUserFeedback({
    event_id: Sentry.lastEventId(),
    email: 'user@school.com',
    name: 'User Name',
    comments: comment,
  });
};
```

### 9.2 Performance Monitoring

```typescript
import * as Sentry from '@sentry/react';

const transaction = Sentry.startTransaction({
  op: "fetch_students",
  name: "Fetch Students from Database",
});

try {
  // Fetch students
  const result = await fetchStudents();
  transaction.finish();
  return result;
} catch (err) {
  transaction.finish();
  throw err;
}
```

### 9.3 Custom Metrics

```typescript
Sentry.captureMessage('Login successful', {
  level: 'info',
  tags: {
    loginMethod: 'email',
    school: schoolId,
  },
});
```

---

## PRICING

### Free Plan
- ✅ 5,000 events/month
- ✅ 30-day data retention
- ✅ Basic error tracking
- ✅ Email alerts

### Pro Plan ($29/month)
- ✅ 100,000+ events/month
- ✅ Extended data retention
- ✅ Advanced features
- ✅ Priority support

**For most schools**: Free plan is sufficient

---

## TROUBLESHOOTING

### Issue: Errors Not Appearing in Sentry
**Solution**:
1. Check DSN is correct
2. Verify environment variable is set
3. Check browser console for errors in Sentry initialization
4. Test with temporary error button

### Issue: Too Many Errors (Quota Exceeded)
**Solution**:
1. Increase `tracesSampleRate` (currently 10%)
2. Upgrade to Pro plan
3. Add more `ignoreErrors` patterns
4. Use beforeSend to filter noise

### Issue: Sensitive Data in Sentry
**Solution**:
1. Update `beforeSend` function
2. Never send passwords, tokens, or PII
3. Use data scrubbing in Sentry settings

---

## BEST PRACTICES

✅ **DO:**
- Set user context for every logged-in user
- Use meaningful error messages
- Add context to errors
- Check Sentry dashboard daily
- Respond to new errors within 24 hours

❌ **DON'T:**
- Send passwords or tokens
- Send sensitive student data
- Ignore warnings
- Let errors pile up unreplied
- Use Sentry as a replacement for logging

---

## NEXT STEPS

1. ✅ Create Sentry account
2. ✅ Install SDK
3. ✅ Configure in app
4. ✅ Set environment variable
5. ✅ Test integration
6. ✅ Set up alerts
7. Deploy to production
8. Monitor for errors
9. Respond to issues
10. Review weekly

---

## SUPPORT

**Sentry Documentation**: https://docs.sentry.io/product/  
**React Integration**: https://docs.sentry.io/platforms/javascript/guides/react/

---

**Setup Time**: ~15 minutes  
**Ongoing Effort**: 10 minutes/day  
**Impact**: Complete visibility into production errors  

Deploy with confidence! 🚀
