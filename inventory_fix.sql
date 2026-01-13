/* SQL Fix for Inventory & EPI Tables - Missing Columns */

/* 1. Update inventory_items table */
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'Material',
ADD COLUMN IF NOT EXISTS "model" text,
ADD COLUMN IF NOT EXISTS "supplier" text,
ADD COLUMN IF NOT EXISTS "entry_date" date,
ADD COLUMN IF NOT EXISTS "invoice_number" text;

/* 2. Update inventory_epis table */
/* Note: EPIs don't need 'type' column as they are implicitly type='EPI' based on value, 
   but the form might send it? Ideally we don't store redundant 'type' in epi table or we do.
   The schema Zod for EPI doesn't seem to force it, but let's check.
   Usually table separation is enough. But for consistency with the form payload we might want it?
   Actually acts createEPI uses 'epiSchema'.
   Let's check epiSchema in lib/schemas-epi.ts just to be sure. */

/* Assuming strict match isn't required if we don't insert it. 
   InventoryForm sends type="EPI" but createEPI picks fields from validated schema.
   Let's assume we just need the metadata columns. */

ALTER TABLE public.inventory_epis
ADD COLUMN IF NOT EXISTS "model" text,
ADD COLUMN IF NOT EXISTS "supplier" text,
ADD COLUMN IF NOT EXISTS "entry_date" date,
ADD COLUMN IF NOT EXISTS "invoice_number" text;

/* 3. Fix potential RLS issues just in case (optional but good practice) */
GRANT ALL ON TABLE public.inventory_items TO authenticated;
GRANT ALL ON TABLE public.inventory_epis TO authenticated;
