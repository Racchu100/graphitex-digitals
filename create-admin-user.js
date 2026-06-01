const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read key/value pairs from .env.local dynamically
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

const phone = '9481086058';
const email = `+91${phone}@graphitex.app`;
const password = 'rakshith';
const name = 'Rakshith Admin';

async function createAdmin() {
  try {
    console.log(`=== Starting Admin Account Creation for +91${phone} ===`);

    // 1. Create or retrieve auth user
    // First check if user already exists in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    let authUser = users.find(u => u.email === email);

    if (authUser) {
      console.log(`Auth user already exists (ID: ${authUser.id}). Updating password...`);
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: password, email_confirm: true }
      );
      if (updateError) throw updateError;
      authUser = updated.user;
    } else {
      console.log("Auth user does not exist. Creating new auth user...");
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          name: name,
          phone: `+91${phone}`
        }
      });
      if (createError) throw createError;
      authUser = created.user;
      console.log(`Auth user successfully created (ID: ${authUser.id})`);
    }

    // First, resolve any conflicting duplicate mobile numbers in the database
    console.log(`Checking for conflicting duplicate mobile number +91${phone} in public.users...`);
    const { data: duplicateUser } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', `+91${phone}`)
      .neq('id', authUser.id)
      .maybeSingle();

    if (duplicateUser) {
      const suffix = Math.random().toString(36).substring(2, 7);
      const staleMobile = '+91' + Math.floor(1000000000 + Math.random() * 9000000000);
      const staleEmail = `+91${phone}-stale-${suffix}@stale.app`;
      console.log(`Conflicting stale user record ${duplicateUser.id} exists. Freeing up unique keys by updating to stale values...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          mobile_number: staleMobile,
          email: staleEmail
        })
        .eq('id', duplicateUser.id);
      
      if (updateError) throw updateError;
      console.log("Stale user unique constraints successfully freed.");
    }

    // 2. Insert or Upsert into public.users table
    console.log("Upserting into public.users table...");
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        name: name,
        email: email,
        mobile_number: `+91${phone}`,
        mobile_verified: true,
        country_id: 1,
        state_id: 1, // Karnataka (default)
        city_id: 1,  // Bangalore (default)
        status: 'active'
      }, { onConflict: 'id' });

    if (userError) throw userError;
    console.log("Successfully upserted public.users record.");

    // 3. Upsert into public.user_roles table
    console.log("Assigning 'admin' role in public.user_roles...");
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: authUser.id,
        role: 'admin'
      }, { onConflict: 'user_id,role' });

    if (roleError) {
      console.warn("Direct upsert with user_id,role constraint failed. Trying manual check/insert...");
      
      // Fallback manual check
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!existingRole) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.id,
            role: 'admin'
          });
        if (insertError) throw insertError;
      }
    }

    console.log("=== Admin Account successfully created & roles updated ===");
  } catch (err) {
    console.error("Admin creation failed with error:", err.message || err);
  }
}

createAdmin();
