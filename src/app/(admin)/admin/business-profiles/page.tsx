import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminBusinessProfilesPage() {
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

  // Fetch business profiles with joined users, cities, and categories
  const { data: profiles } = await supabase
    .from("business_profiles")
    .select(`
      id,
      business_name,
      status,
      created_at,
      users!business_profiles_user_id_fkey (name),
      categories (name),
      cities (name)
    `)
    .order("created_at", { ascending: false });

  const rows = (profiles ?? []).map(p => ({
    name: p.business_name,
    provider: (p.users as any)?.name || "—",
    category: (p.categories as any)?.name || "—",
    location: (p.cities as any)?.name || "—",
    status: p.status,
    created: new Date(p.created_at).toLocaleDateString("en-IN"),
    actions: `/admin/business-profiles/${p.id}`,
  }));

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)", fontSize: "var(--text-2xl)" }}>
        Registered Businesses ({profiles?.length ?? 0})
      </h1>
      <AdminTable
        columns={["Business Name", "Provider", "Category", "City", "Status", "Created", "Actions"]}
        rows={rows}
      />
    </div>
  );
}
