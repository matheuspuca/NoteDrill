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
        const { priceId, planType } = await req.json()

        // Get user profile for metadata (optional, but good for Stripe Customer)
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer_email: user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user.id,
                plan_type: planType // 'basic', 'pro', etc.
            },
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    plan_type: planType
                }
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?checkout=canceled`,
            allow_promotion_codes: true,
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error("[STRIPE_ERROR]", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
