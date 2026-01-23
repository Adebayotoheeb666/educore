// @ts-nocheck
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
    staffId?: string;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        let requestBody: InviteRequest;
        try {
            requestBody = await req.json();
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return new Response(
                JSON.stringify({ error: "Invalid JSON in request body" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // Validate input
        if (!requestBody.email || !requestBody.schoolId || !requestBody.adminId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // Initialize admin client with service role (server-only)
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Generate or use provided staff ID FIRST (so it's always available)
        const staffId = requestBody.staffId || (() => {
            const staffPrefix = requestBody.schoolId.substring(0, 3).toUpperCase();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return `STF-${staffPrefix}-${randomSuffix}`;
        })();

        // 2. Check if user already exists in Auth
        const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
            console.error("Error listing users:", listError);
            throw new Error(`Failed to check existing users: ${listError.message}`);
        }

        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === requestBody.email.toLowerCase().trim());

        let authId = existingUser?.id;

        if (!existingUser) {
            // 3. Verify admin creating this staff is actually admin of the school
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
                    {
                        status: 403,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }

            // 4. Create Auth user via admin API
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email: requestBody.email.toLowerCase().trim(),
                email_confirm: true,
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
                    JSON.stringify({
                        error: "Failed to create Auth user",
                        details: authError
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }
            authId = authData.user?.id;
        }

        // 5. Upsert user profile in DB
        const { error: profileError } = await adminClient
            .from("users")
            .upsert({
                id: authId,
                school_id: requestBody.schoolId,
                email: requestBody.email.toLowerCase().trim(),
                full_name: requestBody.fullName,
                role: requestBody.role,
                phone_number: requestBody.phoneNumber,
                staff_id: staffId,
                assigned_subjects: requestBody.specialization
                    ? [requestBody.specialization]
                    : [],
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            return new Response(
                JSON.stringify({ error: "Failed to create user profile" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // 6. Log action (audit trail)
        await adminClient.from("audit_logs").insert({
            school_id: requestBody.schoolId,
            user_id: requestBody.adminId, // Database uses user_id, function used actor_id (mismatch)
            action: "staff_invited",
            resource_type: "staff",
            resource_id: authId,
            metadata: { // Database uses metadata, function used details (mismatch)
                email: requestBody.email,
                staff_id: staffId,
                role: requestBody.role,
            },
            timestamp: new Date().toISOString(), // Database uses timestamp, function used created_at (mismatch)
        });

        // 7. Success
        return new Response(
            JSON.stringify({
                success: true,
                message: existingUser
                    ? "User already exists. Profile updated with school access."
                    : "Staff invited successfully. Confirmation email sent.",
                staffId: staffId,
                authId: authId,
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
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
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
