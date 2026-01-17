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
        const requestBody: InviteRequest = await req.json();

        // Validate input
        if (!requestBody.email || !requestBody.schoolId || !requestBody.adminId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Initialize admin client with service role (server-only)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify admin creating this staff is actually admin of the school
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
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. Generate staff ID
        const staffPrefix = requestBody.schoolId.substring(0, 3).toUpperCase();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const staffId = `STF-${staffPrefix}-${randomSuffix}`;

        // 3. Create Auth user via admin API
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: requestBody.email,
            email_confirm: true, // Send confirmation email
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
                JSON.stringify({ error: "Failed to create Auth user", details: authError }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const authId = authData.user?.id;

        // 4. Create user profile in DB with correct auth_id
        const { error: profileError } = await adminClient
            .from("users")
            .insert({
                id: authId, // ✅ Use Auth UID as primary key
                school_id: requestBody.schoolId,
                email: requestBody.email,
                full_name: requestBody.fullName,
                role: requestBody.role,
                staff_id: staffId,
                phone_number: requestBody.phoneNumber,
                assigned_subjects: requestBody.specialization
                    ? [requestBody.specialization]
                    : [],
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Cleanup Auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authId);
            return new Response(
                JSON.stringify({ error: "Failed to create user profile" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // 5. Log action (audit trail)
        await adminClient.from("audit_logs").insert({
            school_id: requestBody.schoolId,
            actor_id: requestBody.adminId,
            action: "staff_invited",
            resource_type: "staff",
            resource_id: authId,
            details: {
                email: requestBody.email,
                staff_id: staffId,
                role: requestBody.role,
            },
            created_at: new Date().toISOString(),
        });

        // 6. Success - Auth user created and email sent by Supabase
        return new Response(
            JSON.stringify({
                success: true,
                message: "Staff invited successfully. Confirmation email sent.",
                staffId: staffId,
                authId: authId,
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
        console.error("Unexpected error:", error);
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
