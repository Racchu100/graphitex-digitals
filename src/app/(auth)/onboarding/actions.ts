"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Action to check and delete any stale/orphaned users with the same mobile number but different ID.
 * Bypasses RLS using createAdminClient to ensure the unique constraint is freed.
 * Handles FK references in user_roles, profile_approvals, admin_audit_log before deleting.
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

    if (!duplicateUser) return;

    const staleId = duplicateUser.id;

    // Safety check: Do not delete the conflicting user if they have roles (admin, influencer, provider)
    const { data: duplicateRoles } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", staleId);

    if (duplicateRoles && duplicateRoles.length > 0) {
      const rolesList = duplicateRoles.map((r: { role: string }) => r.role);
      console.log(`Cannot delete conflicting user ${staleId} because they have roles: ${rolesList.join(", ")}`);
      throw new Error("This mobile number is already registered to another active account. Please use a different mobile number.");
    }

    console.log(`Resolving stale user ${staleId} conflicting with mobile number ${phone}`);

    // 1. Delete stale user_roles
    await adminSupabase.from("user_roles").delete().eq("user_id", staleId);

    // 2. Null out business_profiles.approved_by references
    await adminSupabase
      .from("business_profiles")
      .update({ approved_by: null })
      .eq("approved_by", staleId);

    // 3. Re-point profile_approvals.reviewed_by (NOT NULL — must point to valid user)
    await adminSupabase
      .from("profile_approvals")
      .update({ reviewed_by: userId })
      .eq("reviewed_by", staleId);

    // 4. Re-point admin_audit_log.admin_user_id
    await adminSupabase
      .from("admin_audit_log")
      .update({ admin_user_id: userId })
      .eq("admin_user_id", staleId);

    // 5. Now safely delete the stale row
    const { error: deleteError } = await adminSupabase
      .from("users")
      .delete()
      .eq("id", staleId);

    if (deleteError) {
      console.error("Failed to delete conflicting stale user:", deleteError.message);
    } else {
      console.log(`Stale user ${staleId} successfully removed.`);
    }
  } catch (err: any) {
    console.error("Unexpected error resolving stale mobile user:", err);
    throw new Error(err.message || "This mobile number is already registered to another active account. Please use a different mobile number.");
  }
}
