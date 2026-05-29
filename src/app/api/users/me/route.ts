import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("*, user_roles!user_id(*)")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ user: userData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // 1. Delete user from public database (cascades to all user profile & relational tables)
    const { error: dbError } = await adminSupabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (dbError) {
      console.error("Failed to delete DB records for user:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 2. Delete Supabase Auth User record
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error("Failed to delete auth user:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

