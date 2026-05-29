import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "profile-pictures";
    const customPath = formData.get("path") as string || "";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Server-side size validation: 100MB for business-media, 10MB otherwise
    const maxLimit = bucket === "business-media" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxLimit) {
      return NextResponse.json({ error: "File exceeds size limit." }, { status: 400 });
    }

    // 3. Upload file using Admin Client (bypasses RLS)
    const adminClient = createAdminClient();

    // Auto-ensure bucket exists in Supabase storage
    try {
      const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
      if (!listError) {
        const bucketExists = buckets?.some((b: any) => b.name === bucket);
        if (!bucketExists) {
          console.log(`[Upload API] Bucket "${bucket}" does not exist. Creating it as public...`);
          await adminClient.storage.createBucket(bucket, {
            public: true,
          });
        }
      }
    } catch (bucketErr) {
      console.warn("[Upload API] Failed to auto-ensure bucket exists:", bucketErr);
    }

    const fileExt = file.name.split('.').pop() || "png";
    
    let fileName = "";
    if (customPath) {
      fileName = customPath;
    } else {
      fileName = `${user.id}.${fileExt}`;
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 4. Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upload file." }, { status: 500 });
  }
}
