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

// POST /api/admin/opportunities/[id]/remove
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { user, error } = await requireAdmin(supabase);
  if (error) return error;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const reason = body?.reason || "Violates platform guidelines.";

  await adminSupabase
    .from("opportunities")
    .update({ status: "removed", removed_reason: reason })
    .eq("id", id);

  await logAdminAction(supabase, user.id, "remove_opportunity", "opportunity", id, { reason });

  return NextResponse.json({ success: true });
}
