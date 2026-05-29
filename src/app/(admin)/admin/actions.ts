"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { logAdminAction, createNotification } from "@/lib/audit";

/**
 * Checks that the currently logged-in user is authenticated and possesses the 'admin' role.
 * If verified, returns the admin user and standard supabase client context.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: Please log in.");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) throw new Error("Forbidden: Admin access required.");

  return { user, supabase };
}

// ----------------------------------------------------
// 1. Business Profiles Moderation
// ----------------------------------------------------

export async function approveBusinessProfile(id: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("status, user_id, business_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Business profile not found.");

  // Update status to approved and approved by admin
  const { error: updateError } = await adminSupabase
    .from("business_profiles")
    .update({
      status: "approved",
      is_public: true,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) throw updateError;

  // Insert into reviews approvals queue log
  await adminSupabase.from("profile_approvals").insert({
    business_profile_id: id,
    reviewed_by: user.id,
    decision: "approved",
  });

  // Log in admin audit trail
  await logAdminAction(supabase, user.id, "approve_business_profile", "business_profile", id, {
    previous_status: profile.status,
  });

  // Notify the business provider
  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_approved",
    "Profile Approved! 🎉",
    `Your business "${profile.business_name}" has been approved and is now live.`
  );

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/business-profiles");
  revalidatePath(`/admin/business-profiles/${id}`);
  revalidatePath("/admin");
}

export async function rejectBusinessProfile(id: string, reason: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("status, user_id, business_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Business profile not found.");

  const { error: updateError } = await adminSupabase
    .from("business_profiles")
    .update({
      status: "rejected",
      rejection_reason: reason,
      is_public: false,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await adminSupabase.from("profile_approvals").insert({
    business_profile_id: id,
    reviewed_by: user.id,
    decision: "rejected",
    reason,
  });

  await logAdminAction(supabase, user.id, "reject_business_profile", "business_profile", id, {
    previous_status: profile.status,
    reason,
  });

  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_rejected",
    "Profile Not Approved",
    `Your business "${profile.business_name}" was not approved. Reason: ${reason}`
  );

  revalidatePath("/admin/approvals");
  revalidatePath("/admin/business-profiles");
  revalidatePath(`/admin/business-profiles/${id}`);
  revalidatePath("/admin");
}

export async function suspendBusinessProfile(id: string, reason: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("status, user_id, business_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Business profile not found.");

  const { error: updateError } = await adminSupabase
    .from("business_profiles")
    .update({
      status: "suspended",
      is_public: false,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "suspend_business_profile", "business_profile", id, {
    previous_status: profile.status,
    reason,
  });

  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_suspended",
    "Profile Suspended",
    `Your business "${profile.business_name}" has been suspended. Reason: ${reason}`
  );

  revalidatePath("/admin/business-profiles");
  revalidatePath(`/admin/business-profiles/${id}`);
  revalidatePath("/admin");
}

export async function reactivateBusinessProfile(id: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("status, user_id, business_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Business profile not found.");

  const { error: updateError } = await adminSupabase
    .from("business_profiles")
    .update({
      status: "approved",
      is_public: true,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "reactivate_business_profile", "business_profile", id, {
    previous_status: profile.status,
  });

  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_reactivated",
    "Profile Reactivated",
    `Your business "${profile.business_name}" has been reactivated.`
  );

  revalidatePath("/admin/business-profiles");
  revalidatePath(`/admin/business-profiles/${id}`);
  revalidatePath("/admin");
}

// ----------------------------------------------------
// 2. Influencer Profiles Moderation
// ----------------------------------------------------

export async function suspendInfluencerProfile(id: string, reason: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("influencer_profiles")
    .select("status, user_id, display_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Influencer profile not found.");

  const { error: updateError } = await adminSupabase
    .from("influencer_profiles")
    .update({
      status: "suspended",
      is_public: false,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "suspend_influencer_profile", "influencer_profile", id, {
    previous_status: profile.status,
    reason,
  });

  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_suspended",
    "Profile Suspended",
    `Your influencer profile "${profile.display_name}" has been suspended. Reason: ${reason}`
  );

  revalidatePath("/admin/influencers");
  revalidatePath(`/admin/influencers/${id}`);
  revalidatePath("/admin");
}

export async function reactivateInfluencerProfile(id: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: profile } = await supabase
    .from("influencer_profiles")
    .select("status, user_id, display_name")
    .eq("id", id)
    .single();

  if (!profile) throw new Error("Influencer profile not found.");

  const { error: updateError } = await adminSupabase
    .from("influencer_profiles")
    .update({
      status: "published",
      is_public: true,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "reactivate_influencer_profile", "influencer_profile", id, {
    previous_status: profile.status,
  });

  await createNotification(
    adminSupabase,
    profile.user_id,
    "profile_reactivated",
    "Profile Reactivated",
    `Your influencer profile "${profile.display_name}" has been reactivated.`
  );

  revalidatePath("/admin/influencers");
  revalidatePath(`/admin/influencers/${id}`);
  revalidatePath("/admin");
}

// ----------------------------------------------------
// 3. Opportunities Moderation
// ----------------------------------------------------

export async function removeOpportunity(id: string, reason: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("status, posted_by_user_id, title")
    .eq("id", id)
    .single();

  if (!opportunity) throw new Error("Opportunity not found.");

  const { error: updateError } = await adminSupabase
    .from("opportunities")
    .update({
      status: "removed",
      removed_reason: reason,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "remove_opportunity", "opportunity", id, {
    previous_status: opportunity.status,
    reason,
  });

  await createNotification(
    adminSupabase,
    opportunity.posted_by_user_id,
    "opportunity_removed",
    "Opportunity Removed",
    `Your brand campaign "${opportunity.title}" was removed. Reason: ${reason}`
  );

  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/admin");
}

// ----------------------------------------------------
// 4. Users Moderation & RBAC
// ----------------------------------------------------

export async function suspendUser(id: string, reason: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("status, name")
    .eq("id", id)
    .single();

  if (!userData) throw new Error("User not found.");

  const { error: updateError } = await adminSupabase
    .from("users")
    .update({ status: "suspended" })
    .eq("id", id);

  if (updateError) throw updateError;

  // Revoke active sessions or restrict access in RLS.
  await logAdminAction(supabase, user.id, "suspend_user", "user", id, {
    previous_status: userData.status,
    reason,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin");
}

export async function reactivateUser(id: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("status, name")
    .eq("id", id)
    .single();

  if (!userData) throw new Error("User not found.");

  const { error: updateError } = await adminSupabase
    .from("users")
    .update({ status: "active" })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "reactivate_user", "user", id, {
    previous_status: userData.status,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin");
}

export async function grantRole(userId: string, role: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { error: grantError } = await adminSupabase
    .from("user_roles")
    .upsert({
      user_id: userId,
      role,
      granted_by: user.id,
    }, { onConflict: "user_id,role" });

  if (grantError) throw grantError;

  await logAdminAction(supabase, user.id, "grant_role", "user_role", userId, { role });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

export async function revokeRole(userId: string, role: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { error: revokeError } = await adminSupabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);

  if (revokeError) throw revokeError;

  await logAdminAction(supabase, user.id, "revoke_role", "user_role", userId, { role });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

// ----------------------------------------------------
// 5. Category Taxonomy CRUD
// ----------------------------------------------------

export async function createCategory(name: string, slug: string, parentId?: string | null) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: newCat, error: insertError } = await adminSupabase
    .from("categories")
    .insert({
      name,
      slug,
      parent_id: parentId ? parseInt(parentId) : null,
      is_active: true,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  await logAdminAction(supabase, user.id, "create_category", "category", String(newCat.id), {
    name,
    slug,
    parent_id: parentId,
  });

  revalidatePath("/admin/categories");
}

export async function updateCategory(
  id: string,
  name: string,
  slug: string,
  parentId?: string | null,
  isActive?: boolean
) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { error: updateError } = await adminSupabase
    .from("categories")
    .update({
      name,
      slug,
      parent_id: parentId ? parseInt(parentId) : null,
      is_active: isActive ?? true,
    })
    .eq("id", id);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "update_category", "category", id, {
    name,
    slug,
    parent_id: parentId,
    is_active: isActive,
  });

  revalidatePath("/admin/categories");
}

export async function mergeCategories(sourceId: string, targetId: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  if (sourceId === targetId) throw new Error("Source and target categories cannot be the same.");

  const sourceNum = parseInt(sourceId);
  const targetNum = parseInt(targetId);

  // 1. Move business profiles
  await adminSupabase
    .from("business_profiles")
    .update({ category_id: targetNum })
    .eq("category_id", sourceNum);

  // 2. Move influencer profiles
  await adminSupabase
    .from("influencer_profiles")
    .update({ niche_category_id: targetNum })
    .eq("niche_category_id", sourceNum);

  // 3. Move child categories
  await adminSupabase
    .from("categories")
    .update({ parent_id: targetNum })
    .eq("parent_id", sourceNum);

  // 4. Soft delete / deactivate the source category
  await adminSupabase
    .from("categories")
    .update({ is_active: false })
    .eq("id", sourceNum);

  await logAdminAction(supabase, user.id, "merge_category", "category", sourceId, {
    target_category_id: targetId,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/business-profiles");
  revalidatePath("/admin/influencers");
}

// ----------------------------------------------------
// 6. Platform Settings Configuration
// ----------------------------------------------------

export async function updatePlatformConfig(key: string, value: string) {
  const { user, supabase } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { error: updateError } = await adminSupabase
    .from("platform_config")
    .update({
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (updateError) throw updateError;

  await logAdminAction(supabase, user.id, "update_config", "platform_config", key, {
    value,
  });

  revalidatePath("/admin/config");
}
