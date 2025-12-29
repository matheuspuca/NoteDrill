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

        const query = `
      ALTER TABLE public.inventory_epis 
      ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0;
    `;

        console.log('Running query:', query);
        await client.query(query);
        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
