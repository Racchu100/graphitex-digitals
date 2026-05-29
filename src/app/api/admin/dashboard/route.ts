import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/admin/dashboard
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [pendingApprovals, activeServices, totalUsers, activeOpportunities] = await Promise.all([
    supabase.from("business_profiles").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    supabase.from("business_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  // Recent pending approvals (last 5)
  const { data: recentPending } = await supabase
    .from("business_profiles")
    .select("id, business_name, created_at, users(name)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent signups (last 10)
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent audit log (last 10)
  const { data: recentAudit } = await supabase
    .from("admin_audit_log")
    .select("id, action, entity_type, entity_id, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  const mappedPending = (recentPending ?? []).map((bp: any) => ({
    ...bp,
    users: bp.users ? { ...bp.users, full_name: bp.users.name } : null
  }));

  const mappedUsers = (recentUsers ?? []).map((u: any) => ({
    ...u,
    full_name: u.name
  }));

  const mappedAudit = (recentAudit ?? []).map((log: any) => ({
    ...log,
    users: log.users ? { ...log.users, full_name: log.users.name } : null
  }));

  return NextResponse.json({
    stats: {
      pendingApprovals: pendingApprovals.count ?? 0,
      activeServices: activeServices.count ?? 0,
      totalUsers: totalUsers.count ?? 0,
      activeOpportunities: activeOpportunities.count ?? 0,
    },
    recentPending: mappedPending,
    recentUsers: mappedUsers,
    recentAudit: mappedAudit,
  });
}
