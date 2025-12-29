/* FIX: Add missing columns to INVENTORY_ITEMS table (Materials/Tools) */

ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'Material',
ADD COLUMN IF NOT EXISTS "brand" text;

/* Ensure inventory_epis also has them (just in case) */
ALTER TABLE public.inventory_epis 
ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'EPI';

/* Refresh schema cache */
NOTIFY pgrst, 'reload schema';
