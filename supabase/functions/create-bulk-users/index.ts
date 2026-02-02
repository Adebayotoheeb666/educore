import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateUserRequest {
  email: string;
  password: string;
  user_metadata: {
    full_name: string;
    role: string;
    school_id: string;
    staff_id?: string;
  };
}

// Add CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    const body: CreateUserRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.password || !body.user_metadata) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, user_metadata" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client with service role (has admin access)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user with service role (has admin privileges)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: body.user_metadata,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400 }
      );
    }

    if (!authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "No user ID returned from auth" }),
        { status: 400 }
      );
    }

    // Create profile record
    const { data: profileData, error: profileError } = await supabase.rpc(
      "create_user_profile",
      {
        user_id: authData.user.id,
        user_email: body.email,
        user_full_name: body.user_metadata.full_name,
        user_role: body.user_metadata.role,
        user_school_id: body.user_metadata.school_id,
        user_staff_id: body.user_metadata.staff_id || null,
      }
    );

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create profile: " + profileError.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        id: authData.user.id,
        email: body.email,
        user_metadata: body.user_metadata,
        message: "User created successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500 }
    );
  }
});
