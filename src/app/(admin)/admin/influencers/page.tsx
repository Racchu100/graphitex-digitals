import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";

export default async function AdminInfluencersPage() {
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

  // Fetch influencer profiles joined with niche category, city, and social accounts
  const { data: influencers } = await supabase
    .from("influencer_profiles")
    .select(`
      id,
      display_name,
      status,
      created_at,
      categories:niche_category_id (name),
      cities (name),
      social_accounts:influencer_social_accounts (platform, follower_count)
    `)
    .order("created_at", { ascending: false });

  const rows = (influencers ?? []).map(inf => {
    // Dynamically calculate aggregate follower count
    const totalFollowers = (inf.social_accounts as any[])?.reduce(
      (acc, s) => acc + (s.follower_count ?? 0),
      0
    ) || 0;

    return {
      name: inf.display_name,
      niche: (inf.categories as any)?.name || "—",
      location: (inf.cities as any)?.name || "—",
      followers: totalFollowers.toLocaleString("en-IN"),
      status: inf.status,
      joined: new Date(inf.created_at).toLocaleDateString("en-IN"),
      actions: `/admin/influencers/${inf.id}`,
    };
  });

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)", fontSize: "var(--text-2xl)" }}>
        Registered Influencers ({influencers?.length ?? 0})
      </h1>
      <AdminTable
        columns={["Display Name", "Niche Category", "City", "Total Followers", "Status", "Joined", "Actions"]}
        rows={rows}
      />
    </div>
  );
}
