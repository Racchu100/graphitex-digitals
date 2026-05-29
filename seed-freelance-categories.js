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

const freelanceCategories = [
  { name: 'Graphic Design', slug: 'graphic-design' },
  { name: 'Content Writing', slug: 'content-writing' },
  { name: 'Web & App Development', slug: 'web-app-development' },
  { name: 'Video Editing', slug: 'video-editing' },
  { name: 'Social Media Management', slug: 'social-media-management' },
  { name: 'Digital Marketing & SEO', slug: 'digital-marketing-seo' },
  { name: 'UI/UX Design', slug: 'ui-ux-design' },
  { name: 'Voiceover & Audio', slug: 'voiceover-audio' },
  { name: 'Consulting & Strategy', slug: 'consulting-strategy' },
  { name: 'Translation & Languages', slug: 'translation-languages' },
  { name: 'Photography & Videography', slug: 'photography-videography' }
];

async function seed() {
  try {
    console.log("=== Seeding Freelance Categories ===");
    for (const cat of freelanceCategories) {
      const { data, error } = await supabase
        .from('categories')
        .upsert({ ...cat, is_active: true }, { onConflict: 'slug' })
        .select();

      if (error) {
        console.error(`Failed to upsert category ${cat.name}:`, error.message);
      } else {
        console.log(`Successfully upserted category: ${cat.name} (ID: ${data[0].id})`);
      }
    }
    console.log("=== Seeding Completed successfully ===");
  } catch (err) {
    console.error("Seeding failed with exception:", err);
  }
}

seed();
