// ============================================
// RESET PASSWORD EDGE FUNCTION
// Handles password reset requests with admin verification
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface ResetPasswordRequest {
  email: string; // Admin email requesting the reset
  targetUserId: string; // User whose password to reset
  newPassword: string; // New password to set
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
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request
    const body: ResetPasswordRequest = await req.json();
    const { email, targetUserId, newPassword } = body;

    // Validate inputs
    if (!email || !targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, targetUserId, newPassword",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Password must contain uppercase, lowercase, number, and special character",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase Admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify admin is actually an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("id, role, school_id")
      .eq("email", email)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({
          error: "Admin user not found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (adminUser.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Only admins can reset passwords",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Verify target user exists and is in same school
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, school_id, email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetUser) {
      return new Response(
        JSON.stringify({
          error: "Target user not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify same school
    if (targetUser.school_id !== adminUser.school_id) {
      return new Response(
        JSON.stringify({
          error: "Cannot reset password for user in different school",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Update password in Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to reset password: " + updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Log audit event
    await supabase.from("audit_logs").insert({
      school_id: adminUser.school_id,
      user_id: adminUser.id,
      action: "PASSWORD_RESET",
      resource_type: "user",
      resource_id: targetUserId,
      details: {
        target_user: targetUser.email,
        target_name: targetUser.full_name,
        reset_by: email,
      },
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password reset for ${targetUser.full_name} (${targetUser.email})`,
        userId: targetUserId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
