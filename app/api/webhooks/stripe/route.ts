import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const signature = headers().get("Stripe-Signature") as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const subscription = event.data.object as Stripe.Subscription

    const supabase = createClient()

    // Handle Events
    if (event.type === 'checkout.session.completed') {
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const userId = session.metadata?.user_id
        const planType = session.metadata?.plan_type

        if (!userId) {
            console.error("Missing user_id in session metadata")
            return new NextResponse("Error: Missing metadata", { status: 400 })
        }

        // Retrieve full subscription details to get dates
        const subDetails = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription

        // Insert/Update Subscription
        const { error } = await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            status: subDetails.status,
            current_period_end: new Date((subDetails as any).current_period_end * 1000).toISOString()
        })

        if (error) console.error("Error updating subscription:", error)
    }

    if (event.type === 'customer.subscription.updated') {
        // Sync status updates (e.g. past_due, canceled)
        const subscriptionId = subscription.id
        const status = subscription.status
        const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()

        // We might need to map price ID to plan type if user upgraded via Portal, 
        // but for now assume plan_type is static or we'd need a mapping config.
        // Ideally, we store price_id in DB too to reverse map.
        // For simplicity: Just update status/dates.

        const { error } = await supabase
            .from("subscriptions")
            .update({ status, current_period_end: currentPeriodEnd })
            .eq("stripe_subscription_id", subscriptionId)

        if (error) console.error("Error syncing subscription update:", error)
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscriptionId = subscription.id

        const { error } = await supabase
            .from("subscriptions")
            .update({ status: 'canceled' })
            .eq("stripe_subscription_id", subscriptionId)

        if (error) console.error("Error canceling subscription:", error)
    }

    return new NextResponse(null, { status: 200 })
}
