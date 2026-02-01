import { createClient } from "@/lib/supabase/server"
import { addDays, isBefore, isAfter } from "date-fns"

export type PlanType = 'basic' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

interface PlanLimits {
    maxEquipments: number
    maxProjects: number
    maxSupervisors: number
    maxOperators: number
}

// Limits Definition
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    basic: { maxEquipments: 1, maxProjects: 1, maxSupervisors: 1, maxOperators: 1 },
    pro: { maxEquipments: 3, maxProjects: 3, maxSupervisors: 1, maxOperators: 3 },
    enterprise: { maxEquipments: 9999, maxProjects: 9999, maxSupervisors: 9999, maxOperators: 9999 } // "Unlimited"
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

// ... existing imports ...

// ... PLAN_LIMITS ...

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
    let effectivePlan: PlanType | null = null

    if (sub) {
        effectivePlan = sub.plan_type as PlanType
    } else if (isTrialActive) {
        effectivePlan = 'pro' // Trial acts as Pro
    } else {
        return { allowed: false, reason: "Trial expirado. Assine um plano para continuar.", block: true }
    }

    // 4. Determine Dynamic Limits
    let limit = PLAN_LIMITS[effectivePlan][resource === 'equipments' ? 'maxEquipments' : 'maxProjects']

    // Override with DB values if available (Enterprise support) check
    if (sub && resource === 'equipments' && (sub as any).max_equipment) {
        limit = (sub as any).max_equipment
    }
    if (sub && resource === 'projects' && (sub as any).max_projects) {
        limit = (sub as any).max_projects
    }

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

export async function checkTeamLimits(ownerId: string, roleToAdd: 'supervisor' | 'operator') {
    const supabase = createClient()

    // 1. Get Subscription/Plan
    const sub = await getUserSubscription(ownerId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { allowed: false, reason: "No user" }

    const createdAt = new Date(user.created_at)
    const isTrialActive = isBefore(new Date(), addDays(createdAt, TRIAL_DAYS))

    let effectivePlan: PlanType = 'basic'
    if (sub) {
        effectivePlan = sub.plan_type as PlanType
    } else if (isTrialActive) {
        effectivePlan = 'pro'
    } else {
        return { allowed: false, reason: "Trial expired" }
    }

    // 2. Determine Limit
    let limit = PLAN_LIMITS[effectivePlan][roleToAdd === 'supervisor' ? 'maxSupervisors' : 'maxOperators']

    // Override from DB
    if (sub) {
        if (roleToAdd === 'supervisor' && (sub as any).max_supervisors) limit = (sub as any).max_supervisors
        if (roleToAdd === 'operator' && (sub as any).max_operators) limit = (sub as any).max_operators
    }

    // 3. Count Current Usage
    // Get all team members linked to this owner
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('linked_user_id')
        .eq('user_id', ownerId)
        .not('linked_user_id', 'is', null)

    if (!teamMembers || teamMembers.length === 0) {
        return { allowed: true } // No linked users, safe to add
    }

    const linkedUserIds = teamMembers.map(tm => tm.linked_user_id)

    // Count profiles with target role in this list
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', linkedUserIds)
        .eq('role', roleToAdd)

    const currentUsage = count || 0

    if (currentUsage >= limit) {
        return {
            allowed: false,
            reason: `Limite de ${roleToAdd}s atingido (${currentUsage}/${limit}) no plano ${effectivePlan}.`
        }
    }

    return { allowed: true }
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
