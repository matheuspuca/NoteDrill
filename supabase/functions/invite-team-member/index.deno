import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, role, fullName, projectId, redirectTo } = await req.json()

        if (!email) throw new Error("Email is required")

        // 1. Invite User
        const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
                role: role
            },
            redirectTo: redirectTo || 'http://localhost:3000/set-password' // Fallback
        })

        if (authError) throw authError

        const userId = authData.user.id

        // 2. Upsert Profile
        // We use service_role so RLS doesn't block insertion of other users
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
                id: userId,
                full_name: fullName,
                role: role,
                email: email
            })

        if (profileError) {
            console.error("Profile Error:", profileError)
            // Don't fail the request, but log it. Auth user is created.
        }

        // 3. Link to Project (if provided)
        if (projectId) {
            const { error: projectError } = await supabaseClient
                .from('project_members')
                .insert({
                    project_id: projectId,
                    user_id: userId,
                    role: role
                })

            if (projectError) {
                console.error("Project Link Error:", projectError)
            }
        }

        return new Response(
            JSON.stringify({ success: true, userId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
