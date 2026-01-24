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

    // Get all staff in school
    const { data: allStaff, error: staffError } = await adminClient
      .from("users")
      .select("id, full_name, email")
      .eq("school_id", schoolId)
      .in("role", ["staff", "admin", "bursar"]);

    if (staffError) throw staffError;

    // Get all Auth users - NOW we have permission to do this with service role
    const { data: { users: authUsers }, error: authError } =
      await adminClient.auth.admin.listUsers();

    if (authError) throw authError;

    // Find staff without Auth accounts
    const staffWithoutAuth = (allStaff || []).filter((staff) => {
      const hasAuth = authUsers?.some(
        (authUser) =>
          authUser.user_metadata?.staffId === staff.id ||
          authUser.email === staff.email
      );
      return !hasAuth;
    });

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
