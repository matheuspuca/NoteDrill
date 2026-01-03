import { createClient } from "@/lib/supabase/server"
import { addDays, isBefore, isAfter } from "date-fns"

export type PlanType = 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

interface PlanLimits {
    maxEquipments: number
    maxProjects: number
}

// Limits Definition
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    basic: { maxEquipments: 1, maxProjects: 1 },
    pro: { maxEquipments: 3, maxProjects: 3 },
    enterprise: { maxEquipments: 9999, maxProjects: 9999 } // "Unlimited"
}

// Default logic: 14 days trial = Equivalent to PRO features
export const TRIAL_DAYS = 14

export async function getUserSubscription(userId: string) {
    const supabase = createClient()
    const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .maybeSingle()

    return sub
}

export async function checkUsageLimits(userId: string, resource: 'equipments' | 'projects') {
    const supabase = createClient()

    // 1. Get User Creation Date for Trial Logic
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { allowed: false, reason: "User not found" }

    const createdAt = new Date(user.created_at)
    const trialEndsAt = addDays(createdAt, TRIAL_DAYS)
    const isTrialActive = isBefore(new Date(), trialEndsAt)

    // 2. Get Subscription
    const sub = await getUserSubscription(userId)

    // 3. Determine Effective Plan
    // If no active sub but trial is valid -> "pro" (trial)
    // If no active sub and trial expired -> "blocked" (or strict basic? Requirement says "trava", implying block or forced upgrade)

    let effectivePlan: PlanType | null = null

    if (sub) {
        effectivePlan = sub.plan_type as PlanType
    } else if (isTrialActive) {
        effectivePlan = 'pro' // Trial acts as Pro
    } else {
        // Trial expired and no sub
        return { allowed: false, reason: "Trial expirado. Assine um plano para continuar.", block: true }
    }

    // 4. Check Counts
    const limit = PLAN_LIMITS[effectivePlan][resource === 'equipments' ? 'maxEquipments' : 'maxProjects']

    const table = resource === 'equipments' ? 'equipment' : 'projects'
    const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    const currentUsage = count || 0

    if (currentUsage >= limit) {
        return {
            allowed: false,
            reason: `Limite do plano atingido (${currentUsage}/${limit}). Faça um upgrade.`,
            limit,
            currentUsage
        }
    }

    return { allowed: true, plan: effectivePlan, isTrial: !sub && isTrialActive }
}

export async function getSubscriptionStatus(userId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const sub = await getUserSubscription(userId)

    const createdAt = new Date(user.created_at)
    const trialEndsAt = addDays(createdAt, TRIAL_DAYS)
    const isTrialActive = isBefore(new Date(), trialEndsAt)
    const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

    if (sub) {
        return {
            status: sub.status,
            plan: sub.plan_type,
            isTrial: false,
            trialDaysRemaining: 0
        }
    }

    if (isTrialActive) {
        return {
            status: 'trialing',
            plan: 'pro',
            isTrial: true,
            trialDaysRemaining: daysRemaining
        }
    }

    return {
        status: 'expired',
        plan: null,
        isTrial: false,
        trialDaysRemaining: 0
    }
}
