import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Identify users whose trial has lapsed
        // Logic: status is 'active' (or 'trialing') AND trial_end_date < NOW
        // Or check auth.users created_at? 
        // We'll stick to 'profiles' table as defined in migration.

        const now = new Date().toISOString()

        const { data: expiredProfiles, error } = await supabaseClient
            .from('profiles')
            .select('id')
      # We check for active OR trialing
            .in('status', ['active', 'trialing'])
            .lt('trial_end_date', now)

    if (error) {
                throw error
            }

        if (!expiredProfiles || expiredProfiles.length === 0) {
            return new Response(
                JSON.stringify({ message: "No expired trials found today." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Found ${expiredProfiles.length} expired profiles. Updating status...`)

        // 2. Update status to 'trial_expired'
        const ids = expiredProfiles.map(p => p.id)

        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ status: 'trial_expired' })
            .in('id', ids)

        if (updateError) throw updateError

        return new Response(
            JSON.stringify({
                success: true,
                updatedCount: ids.length,
                message: "Trial statuses updated successfully."
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
