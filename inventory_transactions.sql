/* 
  Inventory Transactions Table
  Tracks history of stock movements (In/Out) for KPI calculations like Bit Performance.
*/

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id), -- Where the item was at the time
  equipment_id uuid REFERENCES public.equipment(id), -- Optional: If consumed by a specific machine (e.g., Bit)
  
  quantity numeric NOT NULL,
  type text CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT')), -- IN = Purchase/Return, OUT = Usage, ADJUSTMENT = Correction
  
  description text -- Reason or context
);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions - All Access" ON public.inventory_transactions;
CREATE POLICY "Transactions - All Access" ON public.inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.inventory_transactions TO authenticated;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_project ON public.inventory_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON public.inventory_transactions(created_at);
