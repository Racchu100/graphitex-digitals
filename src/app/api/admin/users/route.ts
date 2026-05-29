import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/audit";

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRole) return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, error: null };
}

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { user, error } = await requireAdmin(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  let query = supabase
    .from("users")
    .select("*, user_roles!user_id(role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count } = await query;
  return NextResponse.json({ data, count });
}

// POST /api/admin/users/[id]/suspend | reactivate | roles
export async function POST(req: NextRequest, { params }: { params: any }) {
  const { id, action } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { user, error } = await requireAdmin(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (action === "suspend") {
    await adminSupabase.from("users").update({ status: "suspended" }).eq("id", id);
    await logAdminAction(supabase, user.id, "suspend_user", "user", id, { reason: body?.reason });
  } else if (action === "reactivate") {
    await adminSupabase.from("users").update({ status: "active" }).eq("id", id);
    await logAdminAction(supabase, user.id, "reactivate_user", "user", id, {});
  } else if (action === "roles") {
    const { role } = body;
    await adminSupabase.from("user_roles").upsert({ user_id: id, role }, { onConflict: "user_id,role" });
    await logAdminAction(supabase, user.id, "grant_role", "user_role", id, { role });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id]/roles/[role]
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  const { id, role } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const { user, error } = await requireAdmin(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await adminSupabase.from("user_roles").delete().eq("user_id", id).eq("role", role);
  await logAdminAction(supabase, user.id, "revoke_role", "user_role", id, { role });

  return NextResponse.json({ success: true });
}
