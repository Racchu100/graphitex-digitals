import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone || !newPassword) {
      return NextResponse.json(
        { error: "Phone number and new password are required." },
        { status: 400 }
      );
    }

    const email = `+91${phone}@graphitex.app`;
    const supabaseAdmin = createAdminClient();

    // 1. Find user by email alias
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const targetUser = users.find((u) => u.email === email);
    if (!targetUser) {
      return NextResponse.json(
        { error: "No account found with this mobile number. Please check the number or sign up." },
        { status: 404 }
      );
    }

    // 2. Update password using administrative role bypass
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Password updated successfully!" });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
