import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const adminClient = createAdminClient();

  try {
    // 1. Create profile-pictures bucket
    const { data: b1, error: e1 } = await adminClient.storage.createBucket("profile-pictures", {
      public: true,
    });

    // 2. Create business-media bucket
    const { data: b2, error: e2 } = await adminClient.storage.createBucket("business-media", {
      public: true,
    });

    return NextResponse.json({
      profilePictures: { data: b1, error: e1?.message },
      businessMedia: { data: b2, error: e2?.message },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
    });
  }
}
