import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logAdminAction, createNotification } from "@/lib/audit";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();

  if (!adminRole) return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, error: null };
}

// POST /api/admin/business-profiles/[id]/approve
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { user, error } = await requireAdmin(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("status, user_id, business_name")
    .eq("id", id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (action === "approve") {
    await adminSupabase
      .from("business_profiles")
      .update({ status: "approved", is_public: true, approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", id);

    await adminSupabase.from("profile_approvals").insert({
      business_profile_id: id,
      reviewed_by: user.id,
      decision: "approved",
    });

    await logAdminAction(supabase, user.id, "approve_business_profile", "business_profile", id, {
      previous_status: profile.status,
    });

    await createNotification(adminSupabase, profile.user_id, "profile_approved",
      "Profile Approved! 🎉",
      `Your business "${profile.business_name}" has been approved and is now live.`,
    );

  } else if (action === "reject") {
    const body = await req.json();
    const reason = body?.reason || "Does not meet platform guidelines.";

    await adminSupabase
      .from("business_profiles")
      .update({ status: "rejected", rejection_reason: reason, is_public: false })
      .eq("id", id);

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

    await createNotification(adminSupabase, profile.user_id, "profile_rejected",
      "Profile Not Approved",
      `Your business "${profile.business_name}" was not approved. Reason: ${reason}`,
    );

  } else if (action === "suspend") {
    const body = await req.json();
    await adminSupabase
      .from("business_profiles")
      .update({ status: "suspended", is_public: false })
      .eq("id", id);

    await logAdminAction(supabase, user.id, "suspend_business_profile", "business_profile", id, {
      reason: body?.reason,
    });

  } else if (action === "reactivate") {
    await adminSupabase
      .from("business_profiles")
      .update({ status: "approved", is_public: true })
      .eq("id", id);

    await logAdminAction(supabase, user.id, "reactivate_business_profile", "business_profile", id, {});
  }

  return NextResponse.json({ success: true });
}
