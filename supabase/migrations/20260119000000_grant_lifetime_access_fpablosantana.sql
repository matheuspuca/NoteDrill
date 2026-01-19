-- GRANT FULL ACCESS (ENTERPRISE)
-- User: fpablosantana@gmail.com

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Attempt to find the user by email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'fpablosantana@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário fpablosantana@gmail.com não encontrado.';
    RETURN;
  END IF;

  -- 2. Manual Upsert (Update first, then Insert)
  
  -- Try UPDATE
  UPDATE public.subscriptions
  SET 
    status = 'active',
    plan_type = 'enterprise',
    current_period_end = now() + interval '99 years',
    stripe_customer_id = 'cus_manual_grant_fpablosantana',
    stripe_subscription_id = 'sub_manual_grant_fpablosantana'
  WHERE user_id = v_user_id;

  -- If no row found, INSERT
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
      'cus_manual_grant_fpablosantana',
      'sub_manual_grant_fpablosantana'
    );
  END IF;

  RAISE NOTICE '✅ Sucesso! Usuário fpablosantana@gmail.com agora possui acesso FULL (Enterprise).';
  
END $$;
