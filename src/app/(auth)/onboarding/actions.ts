"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Action to check and delete any stale/orphaned users with the same mobile number but different ID.
 * Bypasses RLS using createAdminClient to ensure the unique constraint is freed.
 */
export async function resolveStaleMobileUser(userId: string, phone: string): Promise<void> {
  if (!userId || !phone) return;

  try {
    const adminSupabase = createAdminClient();
    const { data: duplicateUser, error: selectError } = await adminSupabase
      .from("users")
      .select("id")
      .eq("mobile_number", phone)
      .neq("id", userId)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking duplicate mobile number:", selectError);
      return;
    }

    if (duplicateUser) {
      console.log(`Deleting stale user ${duplicateUser.id} conflicting with mobile number ${phone}`);
      const { error: deleteError } = await adminSupabase
        .from("users")
        .delete()
        .eq("id", duplicateUser.id);

      if (deleteError) {
        console.error("Failed to delete conflicting stale user:", deleteError);
      }
    }
  } catch (err) {
    console.error("Unexpected error resolving stale mobile user:", err);
  }
}
