// @deno-types="https://deno.land/x/types/deno.d.ts"
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

// Interface for the request body
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

// Interface for the response
interface ApiResponse {
    success: boolean;
    message: string;
    staffId?: string;
    authId?: string;
    error?: string;
    details?: any;
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

        // 2. Check if user already exists in Auth using getUserByEmail (more reliable than listUsers)
        const userEmail = requestBody.email.toLowerCase().trim();
        console.log("Checking for existing user with email:", userEmail);

        const { data: existingAuth, error: lookupError } = await adminClient.auth.admin.getUserByEmail(userEmail);

        if (lookupError && lookupError.status !== 404) {
            console.error("Error checking for existing auth user:", lookupError);
            throw new Error(`Failed to check for existing user: ${lookupError.message}`);
        }

        console.log("Existing auth user found:", !!existingAuth?.user);

        let authId = existingAuth?.user?.id;

        if (!existingAuth?.user) {
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
            console.log(`Attempting to create Auth user for: ${userEmail}`);

            try {
                console.log("Creating new auth user");
                const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
                    email: userEmail,
                    email_confirm: true,
                    user_metadata: {
                        full_name: requestBody.fullName,
                        role: requestBody.role,
                        school_id: requestBody.schoolId,
                        staff_id: staffId,
                    },
                });

                if (createError) throw createError;
                if (authData?.user?.id) {
                    authId = authData.user.id;
                    console.log("Auth user created successfully with ID:", authId);
                } else {
                    throw new Error("Auth user creation succeeded but no user ID returned");
                }
            } catch (error) {
                const authError = error as { status?: number; message?: string };
                console.error("Auth creation error:", authError);
                console.error("Full error object:", JSON.stringify(authError, null, 2));

                // Check if this is a rate limiting error
                if (authError.status === 429) {
                    return new Response(
                        JSON.stringify({
                            error: "Rate limit exceeded",
                            message: "Too many requests. Please wait a few minutes and try again."
                        }),
                        {
                            status: 429,
                            headers: { ...corsHeaders, "Content-Type": "application/json" }
                        }
                    );
                }

                // Provide more helpful error messages
                let errorDetails = authError.message || 'An unknown error occurred';
                let statusCode = 500;

                if (errorDetails.includes('already exists')) {
                    errorDetails = 'Email already registered in system. Try using a different email address.';
                    statusCode = 409; // Conflict
                } else if (authError.message?.includes('invalid')) {
                    errorDetails = `Invalid email format. Please provide a valid email address.`;
                } else if (authError.message?.includes('smtp')) {
                    errorDetails = `Email service unavailable. Please try again later.`;
                } else if (authError.message?.includes('unexpected_failure') || authError.status === 500) {
                    errorDetails = `Supabase Auth service temporary issue. Creating profile without Auth account. Staff can be linked to Auth later.`;

                    // Try to create profile without Auth as fallback
                    console.log("Auth service error, attempting to create profile in database only...");
                    const { error: profileError } = await adminClient
                        .from("users")
                        .upsert({
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
                        console.error("Fallback profile creation also failed:", profileError);
                        return new Response(
                            JSON.stringify({
                                error: "Failed to create Auth user",
                                details: {
                                    message: "Supabase Auth service is experiencing issues. Please try again in a few moments.",
                                    originalError: authError.message
                                }
                            }),
                            {
                                status: 500,
                                headers: { ...corsHeaders, "Content-Type": "application/json" }
                            }
                        );
                    }

                    // Success with fallback - profile created, but no Auth account
                    return new Response(
                        JSON.stringify({
                            success: true,
                            message: "Staff profile created. Note: Auth account creation failed due to service issues. Staff profile is ready in the database.",
                            staffId: staffId,
                            authId: undefined,
                            warning: "Auth account was not created due to temporary service issues. Staff cannot log in yet."
                        }),
                        {
                            status: 200,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        error: "Failed to create Auth user",
                        details: {
                            message: errorDetails,
                            originalError: authError.message
                        }
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }
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
                JSON.stringify({
                    error: "Failed to create user profile",
                    details: profileError
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        // 6. Log action (audit trail)
        const { error: auditError } = await adminClient.from("audit_logs").insert({
            school_id: requestBody.schoolId,
            user_id: requestBody.adminId,
            action: "staff_invited",
            resource_type: "staff",
            resource_id: authId,
            metadata: {
                email: requestBody.email,
                staff_id: staffId,
                role: requestBody.role,
            },
            timestamp: new Date().toISOString(),
        });

        if (auditError) {
            console.error("Audit log error:", auditError);
            // Don't fail the entire operation if audit logging fails
            // Log the error but continue
        }

        // 7. Success
        return new Response(
            JSON.stringify({
                success: true,
                message: existingAuth?.user
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Unexpected error in invite-staff function:", errorMessage, error);

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
