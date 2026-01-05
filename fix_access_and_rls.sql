-- FIX ACCESS & RLS (Final Fix)
-- 1. Grant Access (Manual Upsert)
-- 2. Ensure RLS allows the user to READ their own subscription

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- A. Get User ID
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'comercial@minerattum.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário comercial@minerattum.com não encontrado.';
    RETURN;
  END IF;

  RAISE NOTICE '👤 User ID found: %', v_user_id;

  -- B. Upsert Subscription (Ensure Data Exists)
  UPDATE public.subscriptions
  SET 
    status = 'active',
    plan_type = 'enterprise',
    current_period_end = now() + interval '99 years',
    stripe_customer_id = 'cus_manual_grant_fix',
    stripe_subscription_id = 'sub_manual_grant_fix'
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (
      id, 
      user_id, 
      status, 
      plan_type, 
      current_period_end,
      stripe_customer_id,
      stripe_subscription_id
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      'active',
      'enterprise',
      now() + interval '99 years',
      'cus_manual_grant_fix',
      'sub_manual_grant_fix'
    );
    RAISE NOTICE '✅ Subscription INSERTED.';
  ELSE
    RAISE NOTICE '✅ Subscription UPDATED.';
  END IF;

END $$;

-- C. Fix RLS Policies (Execute outside PL/pgSQL block)

-- 1. Enable RLS (idempotent)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if exists to avoid conflicts (clean start)
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- 3. Create Policy
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Grant Select to Authenticated (just in case)
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
