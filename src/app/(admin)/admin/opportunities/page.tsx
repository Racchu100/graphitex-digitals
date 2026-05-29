import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminOpportunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) redirect("/dashboard/profile");

  // Fetch opportunities with joined business profiles and applications counts
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(`
      id,
      title,
      status,
      expires_at,
      business_profiles (business_name),
      opportunity_applications (id)
    `)
    .order("created_at", { ascending: false });

  const rows = (opportunities ?? []).map(o => {
    const appsCount = (o.opportunity_applications as any[])?.length || 0;

    return {
      title: o.title,
      business: (o.business_profiles as any)?.business_name || "—",
      applications: appsCount.toString(),
      status: o.status,
      expires: new Date(o.expires_at).toLocaleDateString("en-IN"),
      actions: `/admin/opportunities/${o.id}`,
    };
  });

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)", fontSize: "var(--text-2xl)" }}>
        Brand Opportunities ({opportunities?.length ?? 0})
      </h1>
      <AdminTable
        columns={["Campaign Title", "Posting Business", "Applicants", "Status", "Expires", "Actions"]}
        rows={rows}
      />
    </div>
  );
}
