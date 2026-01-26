// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface DeleteRequest {
    staffId: string; // The user ID (auth.uid)
    schoolId: string;
    adminId: string; // Admin performing the delete
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
        const requestBody: DeleteRequest = await req.json();

        if (!requestBody.staffId || !requestBody.schoolId || !requestBody.adminId) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: staffId, schoolId, adminId" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase environment variables");
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Verify admin is authorized to delete (is an admin of this school)
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

        // 2. Prevent admin from deleting themselves
        if (requestBody.staffId === requestBody.adminId) {
            return new Response(
                JSON.stringify({ error: "Cannot delete your own account" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // 3. Get the staff profile for logging
        const { data: staffProfile } = await adminClient
            .from("users")
            .select("*")
            .eq("id", requestBody.staffId)
            .eq("school_id", requestBody.schoolId)
            .maybeSingle();

        if (!staffProfile) {
            return new Response(
                JSON.stringify({ error: "Staff member not found" }),
                {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // 4. Delete the Auth user (this will cascade delete public.users due to FK constraint)
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
            requestBody.staffId
        );

        if (deleteAuthError) {
            console.error("Error deleting auth user:", deleteAuthError);
            // If auth deletion fails, still try to delete the profile for cleanup
            const { error: profileDeleteError } = await adminClient
                .from("users")
                .delete()
                .eq("id", requestBody.staffId)
                .eq("school_id", requestBody.schoolId);

            if (profileDeleteError) {
                return new Response(
                    JSON.stringify({
                        error: "Failed to delete user",
                        details: deleteAuthError.message || "Unknown error"
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }
        }

        // 5. Log the deletion action
        const { error: auditError } = await adminClient
            .from("audit_logs")
            .insert({
                school_id: requestBody.schoolId,
                user_id: requestBody.adminId,
                action: "staff_deleted",
                resource_type: "staff",
                resource_id: requestBody.staffId,
                metadata: {
                    staff_name: staffProfile.full_name,
                    staff_id: staffProfile.staff_id,
                    email: staffProfile.email,
                },
                timestamp: new Date().toISOString(),
            });

        if (auditError) {
            console.error("Audit log error:", auditError);
            // Don't fail the operation if audit logging fails
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Staff member deleted successfully",
                staffId: requestBody.staffId,
                staffName: staffProfile.full_name,
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Unexpected error in delete-staff function:", errorMessage, error);

        return new Response(
            JSON.stringify({
                error: "Internal server error",
                message: errorMessage || "Unknown error occurred",
                details: error instanceof Error ? error.stack : undefined
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
