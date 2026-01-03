import { User } from '@supabase/supabase-js'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

export interface MinimalSubscription {
    status: SubscriptionStatus | string
    // Add other fields if necessary for future logic
}

export interface AccessResult {
    allowed: boolean
    reason?: 'trial_active' | 'subscribed' | 'trial_expired' | 'no_user'
    trialDaysRemaining?: number
}

// 14 days trial strict limit
const TRIAL_DAYS = 14

export function hasAccess(user: User | null, subscription: MinimalSubscription | null): AccessResult {
    if (!user) {
        return { allowed: false, reason: 'no_user' }
    }

    // 1. Check for Active Subscription
    // Allow 'active' and 'trialing' status from Stripe/Provider
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
        return { allowed: true, reason: 'subscribed' }
    }

    // 2. Check for Time-Based Trial
    const createdAt = new Date(user.created_at)
    const now = new Date()

    // Calculate difference in milliseconds
    const diffTime = Math.abs(now.getTime() - createdAt.getTime())
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= TRIAL_DAYS) {
        return {
            allowed: true,
            reason: 'trial_active',
            trialDaysRemaining: TRIAL_DAYS - diffDays
        }
    }

    // 3. Hard Wall
    return { allowed: false, reason: 'trial_expired' }
}
