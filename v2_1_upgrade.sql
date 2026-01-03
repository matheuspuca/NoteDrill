-- Upgrade Pack v2.1 Migration Script

-- 1. Create Inventory Price History Table
CREATE TABLE IF NOT EXISTS inventory_price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL, -- Price at that moment
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter Projects Table (Financial Data)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS payroll_estimate DECIMAL(12, 2) DEFAULT 0, -- Folha pagamento mensal estimada
ADD COLUMN IF NOT EXISTS price_per_m3 DECIMAL(10, 2) DEFAULT 0,    -- Preço cobrado por m3
ADD COLUMN IF NOT EXISTS mob_demob_cost DECIMAL(12, 2) DEFAULT 0,   -- Custo mobilização/desmobilização
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 0;          -- Impostos (%)

-- 3. Alter BDP Reports Table (Rock & Geology)
ALTER TABLE bdp_reports
ADD COLUMN IF NOT EXISTS rock_status TEXT, -- 'Sã', 'Fissurada', 'Sedimento', 'Outros'
ADD COLUMN IF NOT EXISTS rock_status_reason TEXT; -- Motivo se 'Outros'

-- Note: 'penetration_time' column is not being dropped to preserve data integrity, 
-- but it will be removed from the application UI logic.
