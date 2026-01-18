/**
 * Sentry Error Monitoring Configuration
 * 
 * This module initializes Sentry for error tracking and monitoring.
 * All unhandled errors and important events are captured for analysis.
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry error monitoring
 * Call this early in app initialization (in main.tsx)
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip initialization if DSN not configured
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('⚠️  Sentry DSN not configured. Error monitoring disabled.');
    }
    return;
  }

  Sentry.init({
    // DSN for your Sentry project
    dsn,

    // Integrations for advanced features
    integrations: (integrations) => [
      ...integrations.filter(
        (integration) => integration.name !== 'Breadcrumbs'
      ),
      new BrowserTracing({
        // Set tracingOrigins to control which URLs are traced for performance
        tracingOrigins: [
          "localhost",
          /^\//,
          // Add your Supabase domain to trace API calls
          "supabase.co",
          "ingest.sentry.io",
        ],
        // Skip tracing these paths
        shouldCreateSpanForRequest: (url) => {
          return !url.includes("/healthcheck");
        },
      }),
    ],

    // Sample rate for performance monitoring (10% of transactions)
    tracesSampleRate: 0.1,

    // Release identification
    release: import.meta.env.VITE_APP_VERSION || "0.0.0",

    // Environment
    environment: import.meta.env.MODE,

    // Errors to ignore (don't clutter dashboard)
    ignoreErrors: [
      // Browser extensions and plugins
      "top.GLOBALS",
      // Network errors from ad blockers
      "NetworkError",
      "Failed to fetch",
      // Benign frame navigation changes
      "Non-Error promise rejection captured",
      // ResizeObserver errors (not actionable)
      "ResizeObserver loop limit exceeded",
      // Known third-party errors
      "chrome-extension://",
      // Ignore fetch errors from adblockers
      "Error: XHR abort",
    ],

    // Breadcrumbs to track
    maxBreadcrumbs: 50,
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === "http.client") {
        // Only capture error-level HTTP requests
        if (breadcrumb.level !== "error") {
          return null;
        }
      }
      return breadcrumb;
    },

    // Filter/scrub sensitive data before sending
    beforeSend(event, hint) {
      // Don't send if it's a known ignoreable error
      if (hint.originalException instanceof Error) {
        const message = hint.originalException.message;

        // Ignore specific error patterns
        if (message.includes("ResizeObserver")) {
          return null;
        }
      }

      // Scrub request URL if it contains passwords
      if (event.request && event.request.url?.includes("password")) {
        event.request.url = "[REDACTED]";
      }

      // Scrub sensitive breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(crumb => {
          if (crumb.category === "console" && crumb.level === "error") {
            // Keep error logs but check message
            const message = String(crumb.message || "");
            if (message.includes("password") || message.includes("token")) {
              crumb.message = "[SENSITIVE DATA REDACTED]";
            }
          }
          return crumb;
        });
      }

      // Don't send if event has no meaningful data
      if (!event.exception && !event.message) {
        return null;
      }

      return event;
    },

    // Additional config
    denyUrls: [
      // Ignore errors from extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Attach stack traces to messages
    attachStacktrace: true,
  });

  // Set up global error handlers
  window.addEventListener("error", (event) => {
    Sentry.captureException(event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason);
  });

  console.log("✅ Sentry error monitoring initialized");
};

/**
 * Capture an exception with context
 */
export const captureException = (
  error: Error | unknown,
  context?: {
    userId?: string;
    schoolId?: string;
    action?: string;
    data?: Record<string, any>;
  }
) => {
  const err = error instanceof Error ? error : new Error(String(error));

  if (context) {
    Sentry.captureException(err, {
      contexts: {
        app: context,
      },
      tags: {
        action: context.action || "unknown",
      },
    });
  } else {
    Sentry.captureException(err);
  }
};

/**
 * Capture a message event
 */
export const captureMessage = (
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: Record<string, any>
) => {
  Sentry.captureMessage(message, {
    level,
    contexts: context ? { app: context } : undefined,
  });
};

/**
 * Set user context for error tracking
 * Call this after user authenticates
 */
export const setUserContext = (
  userId: string,
  email: string,
  schoolId: string,
  role?: string
) => {
  Sentry.setUser({
    id: userId,
    email: email,
    username: email.split("@")[0], // Use email prefix as username
    other: {
      schoolId: schoolId,
      role: role || "unknown",
    },
  });
};

/**
 * Clear user context
 * Call this on logout
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

/**
 * Set additional context/tags
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (
  message: string,
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category: "user-action",
    data,
    level: "info",
  });
};

/**
 * Capture user feedback
 */
export const captureUserFeedback = (
  email: string,
  name: string,
  comments: string
) => {
  const eventId = Sentry.lastEventId();
  if (eventId) {
    Sentry.captureUserFeedback({
      event_id: eventId,
      email,
      name,
      comments,
    });
  }
};

/**
 * Start a performance transaction
 * Useful for tracking long-running operations
 */
export const startTransaction = (
  op: string,
  name: string
) => {
  return Sentry.startTransaction({
    op,
    name,
  });
};

/**
 * Test Sentry integration
 * Call this to verify Sentry is working
 */
export const testSentry = () => {
  try {
    throw new Error("This is a test error from Sentry");
  } catch (e) {
    captureException(e, {
      action: "test",
      data: {
        message: "This error can be safely ignored",
      },
    });
  }
};

// Export Sentry instance for advanced usage
export { Sentry };
