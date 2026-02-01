-- Add limit columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_equipment INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_supervisors INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_operators INTEGER DEFAULT 1;

-- Function to set defaults based on plan_type
CREATE OR REPLACE FUNCTION set_subscription_limits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_type = 'basic' THEN
    NEW.max_projects := 1;
    NEW.max_equipment := 1;
    NEW.max_supervisors := 1;
    NEW.max_operators := 1;
  ELSIF NEW.plan_type = 'pro' THEN
    NEW.max_projects := 3;
    NEW.max_equipment := 3;
    NEW.max_supervisors := 1;
    NEW.max_operators := 3;
  -- Enterprise keeps whatever values are passed or defaults, 
  -- usually manually updated by admin
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update limits on insert/update of plan_type
DROP TRIGGER IF EXISTS trigger_set_subscription_limits ON public.subscriptions;
CREATE TRIGGER trigger_set_subscription_limits
BEFORE INSERT OR UPDATE OF plan_type ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_subscription_limits();

-- Update existing rows (if any)
UPDATE public.subscriptions SET plan_type = plan_type;
