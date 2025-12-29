
/* Update EPI table to include financial and stock control fields */
ALTER TABLE public.inventory_epis 
ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0;
