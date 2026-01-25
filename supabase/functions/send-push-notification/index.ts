import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
    userId: string
    schoolId: string
    title: string
    body: string
    icon?: string
    badge?: string
    data?: Record<string, any>
    actions?: Array<{ action: string; title: string }>
    tag?: string
    requireInteraction?: boolean
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload: PushNotificationPayload = await req.json()

        // Validate payload
        if (!payload.userId || !payload.title || !payload.body) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Get user's push subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', payload.userId)

        if (subError) {
            console.error('Error fetching subscriptions:', subError)
            return new Response(
                JSON.stringify({ error: 'Failed to fetch subscriptions' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No push subscriptions found for user' }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Get user's notification preferences
        const { data: profile } = await supabaseClient
            .from('users')
            .select('notification_preferences')
            .eq('id', payload.userId)
            .single()

        const preferences = profile?.notification_preferences || {
            push_enabled: true,
            sound_enabled: true,
            vibration_enabled: true,
        }

        // Check if push notifications are enabled
        if (!preferences.push_enabled) {
            return new Response(
                JSON.stringify({ message: 'Push notifications disabled for user' }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // VAPID keys (should be stored in environment variables)
        const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
        const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
        const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@educore.app'

        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
            console.error('VAPID keys not configured')
            return new Response(
                JSON.stringify({ error: 'Push notifications not configured' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            )
        }

        // Send push notification to each subscription
        const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                    },
                }

                // Build notification payload
                const notificationPayload = {
                    title: payload.title,
                    body: payload.body,
                    icon: payload.icon || '/pwa-192x192.png',
                    badge: payload.badge || '/pwa-192x192.png',
                    data: payload.data || {},
                    actions: payload.actions || [],
                    tag: payload.tag,
                    requireInteraction: payload.requireInteraction || false,
                    vibrate: preferences.vibration_enabled ? [200, 100, 200] : undefined,
                    silent: !preferences.sound_enabled,
                }

                // Use web-push library to send notification
                // Note: In a real implementation, you'd use the web-push npm package
                // For this example, we'll make a direct HTTP request to the push service

                const response = await fetch(pushSubscription.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'TTL': '86400', // 24 hours
                        'Urgency': 'normal',
                    },
                    body: JSON.stringify(notificationPayload),
                })

                if (!response.ok) {
                    throw new Error(`Push failed: ${response.status} ${response.statusText}`)
                }

                return { success: true, endpoint: subscription.endpoint }
            })
        )

        // Count successes and failures
        const successes = results.filter((r) => r.status === 'fulfilled').length
        const failures = results.filter((r) => r.status === 'rejected').length

        // Log failed subscriptions
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Failed to send to ${subscriptions[index].endpoint}:`, result.reason)

                // Optionally remove invalid subscriptions
                // This would happen if the subscription is no longer valid
                if (result.reason?.message?.includes('410')) {
                    supabaseClient
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', subscriptions[index].id)
                        .then(() => console.log(`Removed invalid subscription ${subscriptions[index].id}`))
                }
            }
        })

        return new Response(
            JSON.stringify({
                success: true,
                sent: successes,
                failed: failures,
                total: subscriptions.length,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error sending push notification:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
