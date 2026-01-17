// ============================================
// CREATE PAYMENT INTENT EDGE FUNCTION
// Handles Stripe payment intent creation for fee payments
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.8.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

interface PaymentIntentRequest {
  amount: number; // Amount in kobo (for NGN) or cents (for USD)
  currency: string; // "ngn" or "usd"
  studentId: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  feeDescription: string;
  metadata?: Record<string, string>;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter for payment creation
const rateLimitStore = new Map<string, RateLimitStore>();

function checkRateLimit(
  userId: string,
  limit: number = 5,
  windowMs: number = 60000
): boolean {
  const key = `payment:${userId}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count++;
  return true;
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    // Get user ID from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Invalid token format" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    if (!checkRateLimit(token, 5, 60000)) {
      return new Response(
        JSON.stringify({
          error: "Too many payment attempts. Please try again later.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const requestBody: PaymentIntentRequest = await req.json();

    // Validate required fields
    if (
      !requestBody.amount ||
      !requestBody.currency ||
      !requestBody.studentId ||
      !requestBody.schoolId ||
      !requestBody.feeDescription
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: amount, currency, studentId, schoolId, feeDescription",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate amount is positive
    if (requestBody.amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be greater than 0" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(requestBody.amount), // Ensure integer
      currency: requestBody.currency.toLowerCase(),
      description: `${requestBody.feeDescription} - ${requestBody.studentName} (${requestBody.schoolName})`,
      metadata: {
        studentId: requestBody.studentId,
        studentName: requestBody.studentName,
        schoolId: requestBody.schoolId,
        schoolName: requestBody.schoolName,
        feeDescription: requestBody.feeDescription,
        ...(requestBody.metadata || {}),
      },
      // Automatic payment methods for better compatibility
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
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
    console.error("Error creating payment intent:", error);

    // Handle specific Stripe errors
    if (
      error instanceof Stripe.errors.StripeInvalidRequestError ||
      error instanceof Stripe.errors.StripeAuthenticationError
    ) {
      return new Response(
        JSON.stringify({
          error: "Payment service error",
          message: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
