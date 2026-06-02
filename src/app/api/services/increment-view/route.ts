import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch current views_count from business_profiles
    const { data: profile, error: selectError } = await supabase
      .from("business_profiles")
      .select("views_count")
      .eq("id", profileId)
      .maybeSingle();

    if (selectError) {
      console.warn("[services-increment-view] Select views error (might be missing database column):", selectError.message);
      return NextResponse.json({ 
        success: false, 
        message: "views_count column not found. Falling back gracefully." 
      }, { status: 200 });
    }

    const currentViews = profile?.views_count || 0;
    const newViews = currentViews + 1;

    // 2. Update views_count in business_profiles
    const { error: updateError } = await supabase
      .from("business_profiles")
      .update({ views_count: newViews })
      .eq("id", profileId);

    if (updateError) {
      console.error("[services-increment-view] Update views error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, views_count: newViews });
  } catch (error: any) {
    console.error("[services-increment-view] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
