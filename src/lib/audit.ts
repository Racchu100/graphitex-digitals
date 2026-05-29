import { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "approve_business_profile"
  | "reject_business_profile"
  | "suspend_business_profile"
  | "reactivate_business_profile"
  | "suspend_influencer_profile"
  | "reactivate_influencer_profile"
  | "remove_opportunity"
  | "suspend_user"
  | "reactivate_user"
  | "grant_role"
  | "revoke_role"
  | "create_category"
  | "update_category"
  | "merge_category"
  | "update_config";

export type AuditEntityType =
  | "business_profile"
  | "influencer_profile"
  | "opportunity"
  | "user"
  | "user_role"
  | "category"
  | "platform_config";

export async function logAdminAction(
  supabase: SupabaseClient,
  adminUserId: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("Failed to write audit log:", error);
  }
}

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: string,
  title: string,
  body?: string,
  data?: Record<string, unknown>
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body: body ?? null,
    data: data ?? {},
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
}
