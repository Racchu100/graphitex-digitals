const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read key/value pairs from .env.local dynamically to prevent hardcoding secrets
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        supabaseUrl = val;
      } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseKey = val;
      }
    }
  }
} catch (e) {
  console.warn("Could not read .env.local directly, falling back to process.env...");
}

supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxwwjtogufqfcdkajxob.supabase.co';
supabaseKey = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local or process.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeAll() {
  try {
    console.log("=== Starting Complete User Data & Images Wipe ===");

    // 1. Fetch all users from Supabase Auth
    console.log("Fetching all registered users from Supabase Auth...");
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    console.log(`Found ${users.length} users to delete.`);

    // 2. Loop through and delete each user from Auth & DB
    for (const user of users) {
      console.log(`Deleting user: ${user.email || user.phone || user.id}...`);

      // Deleting from public.users first (will cascade cleanly across DB profile and media rows)
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (dbError) {
        console.warn(`Warning: Failed to delete database records for ${user.id}:`, dbError.message);
      }

      // Delete from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        console.error(`Error: Failed to delete Auth user ${user.id}:`, authError.message);
      } else {
        console.log(`Successfully deleted user ${user.id}`);
      }
    }

    // Double check: Clear public.users table completely
    console.log("Ensuring public.users table is fully cleared...");
    const { error: clearUsersErr } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (clearUsersErr) {
      console.warn("Could not completely clear users table (e.g. preserved active admin users):", clearUsersErr.message);
    } else {
      console.log("Users database table cleared successfully.");
    }

    // 3. Clear Storage buckets
    console.log("Emptying 'profile-pictures' storage bucket...");
    try {
      const { error: bucketError1 } = await supabase.storage.emptyBucket('profile-pictures');
      if (bucketError1) {
        console.warn("Warning emptying profile-pictures:", bucketError1.message);
      } else {
        console.log("Successfully emptied 'profile-pictures' bucket.");
      }
    } catch (e) {
      console.warn("Storage error profile-pictures:", e.message);
    }

    console.log("Emptying 'business-media' storage bucket...");
    try {
      const { error: bucketError2 } = await supabase.storage.emptyBucket('business-media');
      if (bucketError2) {
        console.warn("Warning emptying business-media:", bucketError2.message);
      } else {
        console.log("Successfully emptied 'business-media' bucket.");
      }
    } catch (e) {
      console.warn("Storage error business-media:", e.message);
    }

    console.log("=== COMPLETE DATA AND STORAGE WIPE ACCOMPLISHED ===");

  } catch (err) {
    console.error("Wiping operation encountered an exception:", err);
  }
}

wipeAll();
