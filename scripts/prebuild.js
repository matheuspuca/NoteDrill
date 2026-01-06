const fs = require('fs');
const path = require('path');

// Only run this drastic measure on Vercel
if (process.env.VERCEL) {
    console.log('--> Vercel Environment Detected.');
    console.log('--> Removing "supabase" directory to prevent Edge Function compilation errors in Next.js build...');

    const supabaseDir = path.join(__dirname, '..', 'supabase');

    if (fs.existsSync(supabaseDir)) {
        try {
            fs.rmSync(supabaseDir, { recursive: true, force: true });
            console.log('--> SUCCESS: "supabase" directory removed from build environment.');
        } catch (error) {
            console.error('--> ERROR: Failed to remove "supabase" directory:', error);
            // Don't exit with error, try to proceed
        }
    } else {
        console.log('--> "supabase" directory not found. Skipping removal.');
    }
} else {
    console.log('--> Local environment detected. Preserving "supabase" directory.');
}
