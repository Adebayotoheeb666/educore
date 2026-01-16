// ============================================
// PAYMENT WEBHOOK EDGE FUNCTION
// Handles Stripe payment confirmation webhooks
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@14.8.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
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
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Webhook event received:", event.type);

    // Handle payment intent success
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const studentId = paymentIntent.metadata?.studentId;
      const schoolId = paymentIntent.metadata?.schoolId;
      const feeDescription = paymentIntent.metadata?.feeDescription;

      if (!studentId || !schoolId) {
        console.error("Missing metadata in payment intent", paymentIntent.id);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Webhook received but metadata missing",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Record the payment in the database
      const { error: insertError } = await supabase
        .from("financial_transactions")
        .insert({
          school_id: schoolId,
          student_id: studentId,
          type: "fee-payment",
          amount: paymentIntent.amount / 100, // Convert from cents to naira (or divide by 100 for USD cents)
          reference: paymentIntent.id,
          payment_method: "card",
          description: feeDescription || "Fee Payment",
          status: "completed",
          created_at: new Date(paymentIntent.created * 1000).toISOString(),
        });

      if (insertError) {
        console.error("Error recording payment:", insertError);
        // Still return 200 to prevent Stripe retry
        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment received but database error",
            error: insertError.message,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update invoice status to paid (if invoice reference exists)
      if (paymentIntent.metadata?.invoiceId) {
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_date: new Date().toISOString(),
            payment_method: "card",
            transaction_ref: paymentIntent.id,
          })
          .eq("id", paymentIntent.metadata.invoiceId)
          .eq("school_id", schoolId);

        if (updateError) {
          console.error("Error updating invoice:", updateError);
        }
      }

      console.log(
        "Payment recorded successfully:",
        paymentIntent.id,
        "for student",
        studentId
      );
    }

    // Handle payment intent failures
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const studentId = paymentIntent.metadata?.studentId;
      const schoolId = paymentIntent.metadata?.schoolId;

      if (studentId && schoolId) {
        // Log failed payment attempt
        const { error } = await supabase
          .from("financial_transactions")
          .insert({
            school_id: schoolId,
            student_id: studentId,
            type: "fee-payment",
            amount: paymentIntent.amount / 100,
            reference: paymentIntent.id,
            payment_method: "card",
            description: `Failed: ${paymentIntent.metadata?.feeDescription || "Fee Payment"}`,
            status: "failed",
            created_at: new Date(paymentIntent.created * 1000).toISOString(),
          });

        if (error) {
          console.error("Error logging failed payment:", error);
        }
      }

      console.log("Payment failed:", paymentIntent.id);
    }

    // Handle charge refunds
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;

      if (charge.payment_intent) {
        // Record refund
        const { data: transaction } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("reference", String(charge.payment_intent))
          .single();

        if (transaction) {
          const { error } = await supabase
            .from("financial_transactions")
            .insert({
              school_id: transaction.school_id,
              student_id: transaction.student_id,
              type: "refund",
              amount: charge.amount_refunded / 100,
              reference: charge.id,
              payment_method: "card",
              description: `Refund for payment ${charge.payment_intent}`,
              status: "completed",
            });

          if (error) {
            console.error("Error recording refund:", error);
          }
        }
      }

      console.log("Refund processed:", charge.id);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        eventType: event.type,
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
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Webhook processing failed",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
