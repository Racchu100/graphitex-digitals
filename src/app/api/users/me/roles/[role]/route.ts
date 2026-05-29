import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const { role } = await params;
    
    // In a real app we might use createClient to check the current user session,
    // but we can also handle it by checking the auth token via admin client or standard client.
    // Assuming standard client for session checking:
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .match({ user_id: user.id, role: role });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
