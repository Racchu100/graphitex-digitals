import { createClient } from "@supabase/supabase-js";

// Admin client bypasses RLS — use only in trusted server contexts.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
