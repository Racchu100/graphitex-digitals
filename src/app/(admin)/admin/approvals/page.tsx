import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApprovalQueue from "./ApprovalQueue";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRole) redirect("/dashboard/profile");

  const { data: pending } = await supabase
    .from("business_profiles")
    .select(`
      *,
      users!business_profiles_user_id_fkey (id, name, mobile_number),
      categories (name),
      cities (name),
      business_media (url, media_type)
    `)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)" }}>
        Approval Queue ({pending?.length ?? 0})
      </h1>
      <ApprovalQueue profiles={pending ?? []} />
    </div>
  );
}
