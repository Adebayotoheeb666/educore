import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

interface CreateAuthRequest {
  schoolId: string;
  staffId: string;
  staffName: string;
  email?: string;
}

function generateTemporaryPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "@$!%*?&";

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 6; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function getStaffVirtualEmail(schoolId: string, staffId: string): string {
  const cleanSchool = schoolId.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const cleanStaffId = staffId.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${cleanStaffId}@${cleanSchool}.educore.app`;
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
    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a client with the anonKey and global Authorization header
    // to validate the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get the current user using the Authorization header
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error("Token validation error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid JWT", details: authError?.message }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole?.toLowerCase() !== "admin") {
      console.warn(`User ${user.id} attempted to create staff auth but is not admin. Role: ${userRole}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const { schoolId, staffId, staffName, email }: CreateAuthRequest =
      await req.json();

    if (!schoolId || !staffId || !staffName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: schoolId, staffId, staffName",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate virtual email if not provided
    const virtualEmail = email || getStaffVirtualEmail(schoolId, staffId);

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Create Auth account with service role
    const { data, error } = await adminClient.auth.admin.createUser({
      email: virtualEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "staff",
        schoolId: schoolId,
        staffId: staffId,
        fullName: staffName,
        staffAuthCreatedAt: new Date().toISOString(),
      },
    });

    if (error || !data.user) {
      console.error("Create user error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || "Failed to create Auth account",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        authId: data.user.id,
        message: "Auth account created for staff member",
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
    console.error("Create staff auth error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
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
