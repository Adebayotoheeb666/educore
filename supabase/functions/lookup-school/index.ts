// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface LookupRequest {
    schoolName: string;
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
        const requestBody: LookupRequest = await req.json();
        
        if (!requestBody.schoolName) {
            return new Response(
                JSON.stringify({ error: "schoolName is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase environment variables");
        }

        // Use service role (server-side only) to bypass RLS
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await adminClient
            .from("schools")
            .select("id, name, address")
            .ilike("name", `%${requestBody.schoolName}%`)
            .limit(5);

        if (error) {
            console.error("Error looking up school:", error);
            return new Response(
                JSON.stringify({
                    schools: [],
                    error: error.message
                }),
                {
                    status: 200, // Return 200 so client handles empty results gracefully
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                }
            );
        }

        return new Response(
            JSON.stringify({
                schools: data || [],
                error: null
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Unexpected error in lookup-school function:", errorMessage);

        return new Response(
            JSON.stringify({
                schools: [],
                error: errorMessage
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
