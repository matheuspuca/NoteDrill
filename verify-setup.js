const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error("Could not load .env.local file:", e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("--- Environment Check ---");
console.log("SUPABASE_URL:", supabaseUrl ? "Present" : "MISSING");
if (supabaseUrl) {
    console.log("  Length:", supabaseUrl.length);
    console.log("  Prefix:", supabaseUrl.substring(0, 15) + "...");
}
console.log("SUPABASE_KEY:", supabaseKey ? "Present" : "MISSING");
if (supabaseKey) {
    console.log("  Length:", supabaseKey.length);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Cannot proceed.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log("\n--- Database Check ---");
    console.log("Attempting to select from 'projects' table...");

    // We try to select 1 row just to verify connection
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Database Error (Message):", error.message);
        console.error("Code:", error.code);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        if (!error.message && !error.code) {
            console.error("Full Error Dump:", JSON.stringify(error, null, 2));
        }
    } else {
        console.log("Success! Connection established.");
        console.log("Rows matched:", data ? data.length : 0);
    }
}

checkDb();
