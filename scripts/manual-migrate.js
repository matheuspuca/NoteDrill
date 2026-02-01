const { Client } = require('pg');

const client = new Client({
    user: 'mcp_analyst',
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    database: 'postgres',
    password: 'Minerattum45345000',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        const queries = [
            `ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 1`,
            `ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_equipment INTEGER DEFAULT 1`,
            `ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_supervisors INTEGER DEFAULT 1`,
            `ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS max_operators INTEGER DEFAULT 1`,
            `
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
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            `,
            `DROP TRIGGER IF EXISTS trigger_set_subscription_limits ON public.subscriptions`,
            `
            CREATE TRIGGER trigger_set_subscription_limits
            BEFORE INSERT OR UPDATE OF plan_type ON public.subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION set_subscription_limits();
            `,
            `UPDATE public.subscriptions SET plan_type = plan_type`
        ];

        for (const q of queries) {
            console.log('Running query:', q);
            await client.query(q);
        }
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
