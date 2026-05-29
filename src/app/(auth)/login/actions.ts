"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public Server Action to check if a mobile number is registered.
 * Bypasses RLS since it runs in a trusted server environment.
 */
export async function checkMobileRegistered(phone: string): Promise<boolean> {
  if (!phone || phone.length < 10) return false;

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("users")
      .select("id")
      .eq("mobile_number", `+91${phone}`)
      .maybeSingle();

    if (error) {
      console.error("Error in checkMobileRegistered Server Action:", error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error("Unexpected error in checkMobileRegistered Server Action:", err);
    return false;
  }
}
