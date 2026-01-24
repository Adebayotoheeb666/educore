import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface AuditRequest {
  schoolId: string;
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
    const { schoolId }: AuditRequest = await req.json();

    if (!schoolId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: schoolId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize server client with service role (has admin permissions)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all staff in school with their auth status
    const { data: allStaff, error: staffError } = await adminClient
      .from("users")
      .select("id, full_name, email")
      .eq("school_id", schoolId)
      .in("role", ["staff", "admin", "bursar"]);

    if (staffError) throw staffError;

    // Get only the staff we found to check auth accounts more efficiently
    // Try to look up auth users by email only (faster than listUsers)
    const staffEmails = (allStaff || []).map(s => s.email).filter(Boolean);

    let staffWithoutAuth = allStaff || [];

    // Only query auth if we have staff to check
    if (staffEmails.length > 0) {
      try {
        // Use listUsers with an optional limit parameter if available
        // Fall back to checking all users if needed
        const { data: { users: authUsers }, error: authError } =
          await adminClient.auth.admin.listUsers({
            perPage: 10000, // Get more users per page
            page: 0,
          });

        if (authError) {
          console.warn("Auth list error, assuming all staff need auth:", authError);
          // If auth listing fails, assume all need auth (conservative)
        } else if (authUsers) {
          // Find staff without Auth accounts
          staffWithoutAuth = (allStaff || []).filter((staff) => {
            const hasAuth = authUsers.some(
              (authUser) =>
                authUser.user_metadata?.staffId === staff.id ||
                authUser.email === staff.email
            );
            return !hasAuth;
          });
        }
      } catch (e) {
        console.warn("Auth check failed, assuming all staff need auth:", e);
        // If anything fails, conservatively assume all need auth
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalStaff: allStaff?.length || 0,
        staffWithAuth: (allStaff?.length || 0) - staffWithoutAuth.length,
        staffWithoutAuth: staffWithoutAuth.map((s) => ({
          id: s.id,
          name: s.full_name || "Unknown",
          email: s.email || "No email",
        })),
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
    console.error("Audit staff auth error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        totalStaff: 0,
        staffWithAuth: 0,
        staffWithoutAuth: [],
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
