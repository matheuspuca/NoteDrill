import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
    apiVersion: '2025-12-15.clover'
})

export async function POST(req: NextRequest) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("stripe_customer_id")
            .eq("user_id", user.id)
            .single()

        if (!subscription?.stripe_customer_id) {
            return new NextResponse("No subscription found", { status: 404 })
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error("[STRIPE_PORTAL_ERROR]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
